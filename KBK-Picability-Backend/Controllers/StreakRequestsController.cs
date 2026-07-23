using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.DTOs;
using Picability.Models;
using System.Security.Claims;
using Picability.Services;

namespace Picability.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class StreakRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PushNotificationService _pushNotificationService;

        public StreakRequestsController(
            ApplicationDbContext context,
            PushNotificationService pushNotificationService)
        {
            _context = context;
            _pushNotificationService = pushNotificationService;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        [HttpPost]
        public async Task<IActionResult> SendStreakRequest(
      CreateStreakRequestDto dto)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var normalizedCycleUnit =
                dto.CycleUnit?.Trim().ToLowerInvariant() switch
                {
                    "day" => "Day",
                    "week" => "Week",
                    "month" => "Month",
                    _ => null
                };

            if (dto.RequiredCheckIns < 1)
            {
                return BadRequest(new
                {
                    message =
                        "Required check-ins must be at least 1."
                });
            }

            if (dto.CycleLength < 1)
            {
                return BadRequest(new
                {
                    message =
                        "Cycle length must be at least 1."
                });
            }

            if (normalizedCycleUnit == null)
            {
                return BadRequest(new
                {
                    message =
                        "Cycle unit must be Day, Week, or Month."
                });
            }

            if (dto.RequiredCheckIns > 100)
            {
                return BadRequest(new
                {
                    message =
                        "Required check-ins cannot exceed 100 per cycle."
                });
            }

            if (dto.CycleLength > 365)
            {
                return BadRequest(new
                {
                    message =
                        "Cycle length cannot exceed 365 units."
                });
            }

            var normalizedHabitName =
                dto.HabitName.Trim();

            if (string.IsNullOrWhiteSpace(normalizedHabitName))
            {
                return BadRequest(new
                {
                    message = "Habit name is required."
                });
            }

            var normalizedHabitNameLower =
                normalizedHabitName.ToLower();

            /*
             * Determine which users are being invited.
             *
             * Standard streak:
             *     ReceiverId
             *
             * Group streak:
             *     ReceiverIds
             */
            List<string> receiverIds;

            if (dto.IsGroupRequest)
            {
                receiverIds = dto.ReceiverIds
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Distinct()
                    .ToList();

                /*
                 * A group streak must contain more than two total users.
                 *
                 * Creator + at least two invited friends = 3 users.
                 */
                if (receiverIds.Count < 2)
                {
                    return BadRequest(new
                    {
                        message =
                            "A group streak must include at least two invited friends."
                    });
                }
            }
            else
            {
                if (string.IsNullOrWhiteSpace(dto.ReceiverId))
                {
                    return BadRequest(new
                    {
                        message =
                            "A friend must be selected before starting a streak."
                    });
                }

                receiverIds = new List<string>
        {
            dto.ReceiverId
        };
            }

            if (receiverIds.Contains(currentUserId))
            {
                return BadRequest(
                    "You cannot send a streak request to yourself."
                );
            }

            /*
             * Every invited member must already be friends
             * with the creator.
             */
            foreach (var receiverId in receiverIds)
            {
                var areFriends =
                    await _context.Friends.AnyAsync(f =>
                        (
                            f.UserId == currentUserId &&
                            f.FriendId == receiverId
                        ) ||
                        (
                            f.UserId == receiverId &&
                            f.FriendId == currentUserId
                        )
                    );

                if (!areFriends)
                {
                    return BadRequest(new
                    {
                        message =
                            "Every participant must be your friend before starting a streak."
                    });
                }
            }

            /*
             * Preserve the existing duplicate checks for the
             * standard two-person streak flow.
             */
            if (!dto.IsGroupRequest)
            {
                var receiverId = receiverIds[0];

                bool duplicatePending =
                    await _context.StreakRequests.AnyAsync(sr =>
                        !sr.IsGroupRequest &&
                        sr.Status == "Pending" &&
                        (
                            (
                                sr.SenderId == currentUserId &&
                                sr.ReceiverId == receiverId
                            ) ||
                            (
                                sr.SenderId == receiverId &&
                                sr.ReceiverId == currentUserId
                            )
                        ) &&
                        sr.HabitName.Trim().ToLower() ==
                            normalizedHabitNameLower
                    );

                if (duplicatePending)
                {
                    return Conflict(new
                    {
                        message =
                            "A pending request already exists for this habit between these users."
                    });
                }

                bool duplicateActive =
                    await _context.Streaks.AnyAsync(s =>
                        s.IsActive &&
                        !s.IsGroupStreak &&
                        (
                            (
                                s.UserOneId == currentUserId &&
                                s.UserTwoId == receiverId
                            ) ||
                            (
                                s.UserOneId == receiverId &&
                                s.UserTwoId == currentUserId
                            )
                        ) &&
                        s.HabitName.Trim().ToLower() ==
                            normalizedHabitNameLower
                    );

                if (duplicateActive)
                {
                    return Conflict(new
                    {
                        message =
                            "You already have an active streak for this habit with this friend."
                    });
                }
            }
            else
            {
                /*
                 * Prevent the creator from sending the same
                 * pending group invitation twice.
                 *
                 * Compare the complete invited-member set.
                 */
                var pendingGroupRequests =
                    await _context.StreakRequests
                        .Include(sr => sr.Members)
                        .Where(sr =>
                            sr.IsGroupRequest &&
                            sr.Status == "Pending" &&
                            sr.SenderId == currentUserId &&
                            sr.HabitName.Trim().ToLower() ==
                                normalizedHabitNameLower
                        )
                        .ToListAsync();

                var requestedMemberIds =
                    receiverIds
                        .OrderBy(id => id)
                        .ToList();

                var duplicateGroupRequest =
                    pendingGroupRequests.Any(request =>
                    {
                        var existingMemberIds =
                            request.Members
                                .Select(member => member.UserId)
                                .OrderBy(id => id)
                                .ToList();

                        return existingMemberIds
                            .SequenceEqual(requestedMemberIds);
                    });

                if (duplicateGroupRequest)
                {
                    return Conflict(new
                    {
                        message =
                            "An identical pending group streak request already exists."
                    });
                }
            }

            /*
             * ReceiverId remains populated for backwards compatibility.
             *
             * For a group request, the first invited member is used only
             * as the legacy ReceiverId anchor. Actual group membership
             * lives in StreakRequestMembers.
             */
            var request = new StreakRequest
            {
                SenderId = currentUserId,
                ReceiverId = receiverIds[0],

                HabitName = normalizedHabitName,
                HabitIcon = dto.HabitIcon,
                Color = dto.Color,

                RequiredCheckIns = dto.RequiredCheckIns,
                CycleLength = dto.CycleLength,
                CycleUnit = normalizedCycleUnit,

                IsGroupRequest = dto.IsGroupRequest,

                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.StreakRequests.Add(request);

            /*
             * Save first so request.Id is generated.
             */
            await _context.SaveChangesAsync();

            /*
             * Every request now gets member records.
             *
             * Standard request = one StreakRequestMember.
             * Group request = multiple StreakRequestMembers.
             */
            var requestMembers =
                receiverIds.Select(receiverId =>
                    new StreakRequestMember
                    {
                        StreakRequestId = request.Id,
                        UserId = receiverId,
                        Status = "Pending"
                    }
                )
                .ToList();

            _context.StreakRequestMembers.AddRange(
                requestMembers
            );

            await _context.SaveChangesAsync();

            var senderName =
                await _context.Users
                    .Where(u => u.Id == currentUserId)
                    .Select(u => u.UserName)
                    .FirstOrDefaultAsync();

            /*
             * Every invited user receives their own notification.
             */
            foreach (var receiverId in receiverIds)
            {
                await _pushNotificationService
                    .NotifyStreakRequestAsync(
                        receiverId,
                        senderName ?? "Your friend",
                        normalizedHabitName
                    );
            }

            return Ok(new
            {
                request.Id,
                request.SenderId,
                request.HabitName,
                request.HabitIcon,
                request.Color,
                request.RequiredCheckIns,
                request.CycleLength,
                request.CycleUnit,
                request.IsGroupRequest,
                request.Status,
                request.CreatedAt,
                ReceiverIds = receiverIds
            });
        }

        // ADDED BY REECE
        // Before: No endpoint for the UI to fetch incoming streak requests for a user
        // After: Added this endpoint to fetch incoming streak requests for a user, 
        // including sender info
        [HttpGet("incoming")]
        public async Task<IActionResult> GetIncomingRequests()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            /*
             * Standard two-person requests.
             */
            var standardRequests = await _context.StreakRequests
                .Include(sr => sr.Sender)
                .Where(sr =>
                    !sr.IsGroupRequest &&
                    sr.ReceiverId == currentUserId &&
                    sr.Status == "Pending"
                )
                .ToListAsync();

            /*
             * Group requests only appear for members who
             * personally still have a pending response.
             */
            var groupRequests = await _context.StreakRequests
                .Include(sr => sr.Sender)
                .Include(sr => sr.Members)
                    .ThenInclude(member => member.User)
                .Where(sr =>
                    sr.IsGroupRequest &&
                    sr.Status == "Pending" &&
                    sr.Members.Any(member =>
                        member.UserId == currentUserId
                    )
                )
                .ToListAsync();

            /*
             * Project after the database query has completed.
             * Using object here allows standard and group results
             * to share one response collection safely.
             */
            var results = new List<object>();

            results.AddRange(
                standardRequests.Select(sr => new
                {
                    sr.Id,
                    sr.HabitName,
                    sr.HabitIcon,
                    sr.Color,

                    sr.RequiredCheckIns,
                    sr.CycleLength,
                    sr.CycleUnit,

                    sr.Status,
                    sr.CreatedAt,

                    sr.IsGroupRequest,

                    SenderName = sr.Sender.UserName,
                    SenderId = sr.SenderId,

                    Members = Array.Empty<object>()
                })
            );

            results.AddRange(
                groupRequests.Select(sr => new
                {
                    sr.Id,
                    sr.HabitName,
                    sr.HabitIcon,
                    sr.Color,

                    sr.RequiredCheckIns,
                    sr.CycleLength,
                    sr.CycleUnit,

                    sr.Status,
                    sr.CreatedAt,

                    sr.IsGroupRequest,

                    SenderName = sr.Sender.UserName,
                    SenderId = sr.SenderId,

                    CurrentUserStatus = sr.Members
                        .Where(member =>
                            member.UserId == currentUserId
                        )
                        .Select(member => member.Status)
                        .FirstOrDefault() ?? "Pending",

                    Members = sr.Members
                        .Select(member => new
                        {
                            member.UserId,
                            UserName =
                                member.User.UserName,
                            member.Status
                        })
                        .ToList()
                })
            );

            return Ok(results);
        }

        [HttpGet("outgoing")]
        public async Task<IActionResult> GetOutgoingRequests()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var requests = await _context.StreakRequests
                .Include(sr => sr.Receiver)
                .Include(sr => sr.Members)
                    .ThenInclude(member => member.User)
                .Where(sr =>
                    sr.SenderId == currentUserId &&
                    sr.Status == "Pending"
                )
                .ToListAsync();

            var results = new List<object>();

            foreach (var request in requests)
            {
                if (request.IsGroupRequest)
                {
                    results.Add(new
                    {
                        request.Id,
                        request.HabitName,
                        request.HabitIcon,
                        request.Color,

                        request.RequiredCheckIns,
                        request.CycleLength,
                        request.CycleUnit,

                        request.Status,
                        request.CreatedAt,

                        request.IsGroupRequest,

                        ReceiverName = (string?)null,
                        ReceiverId = (string?)null,

                        Members = request.Members
                            .Select(member => new
                            {
                                member.UserId,
                                UserName =
                                    member.User.UserName,
                                member.Status
                            })
                            .ToList()
                    });
                }
                else
                {
                    results.Add(new
                    {
                        request.Id,
                        request.HabitName,
                        request.HabitIcon,
                        request.Color,

                        request.RequiredCheckIns,
                        request.CycleLength,
                        request.CycleUnit,

                        request.Status,
                        request.CreatedAt,

                        request.IsGroupRequest,

                        ReceiverName =
                            request.Receiver.UserName,

                        ReceiverId =
                            request.ReceiverId,

                        Members =
                            Array.Empty<object>()
                    });
                }
            }

            return Ok(results);
        }

        [HttpDelete("cancel/{requestId}")]
        public async Task<IActionResult> CancelStreakRequest(int requestId)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var request = await _context.StreakRequests
                .FirstOrDefaultAsync(sr => sr.Id == requestId);

            if (request == null)
                return NotFound("Streak request not found.");

            if (request.SenderId != currentUserId)
                return Forbid();

            if (request.Status != "Pending")
                return BadRequest("Only pending streak requests can be cancelled.");

            _context.StreakRequests.Remove(request);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Streak request cancelled.",
                requestId = request.Id
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetMine()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var requests = await _context.StreakRequests
                .Include(sr => sr.Members)
                    .ThenInclude(member => member.User)
                .Where(sr =>
                    sr.SenderId == currentUserId ||
                    sr.ReceiverId == currentUserId ||
                    sr.Members.Any(member =>
                        member.UserId == currentUserId
                    )
                )
                .ToListAsync();

            var results = requests.Select(sr => new
            {
                sr.Id,
                sr.SenderId,
                sr.ReceiverId,

                sr.HabitName,
                sr.HabitIcon,
                sr.Color,

                sr.RequiredCheckIns,
                sr.CycleLength,
                sr.CycleUnit,

                sr.Status,
                sr.CreatedAt,

                sr.IsGroupRequest,

                Members = sr.Members
                    .Select(member => new
                    {
                        member.UserId,
                        UserName = member.User.UserName,
                        member.Status
                    })
                    .ToList()
            });

            return Ok(results);
        }

        // MODIFIED BY REECE
        // Before: LastCompletedAt or FailedAt could be NULL, which caused issues 
        // when creating a new streak as these fields are NOT NULL in the database. 
        // After: When accepting a streak request, set default values for LastCompletedAt 
        // and FailedAt to avoid NULL values and satisfy the database constraints.
        // POST api/streakrequests/accept/{requestId}
        [HttpPost("accept/{requestId}")]
        public async Task<IActionResult> AcceptStreakRequest(int requestId)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var request = await _context.StreakRequests
                .FirstOrDefaultAsync(sr => sr.Id == requestId);

            if (request == null)
                return NotFound("Streak request not found.");

            /*
             * Group request acceptance is handled separately.
             * Do not allow the legacy two-person acceptance flow
             * to accidentally create a partial group streak.
             */
            if (request.IsGroupRequest)
            {
                return BadRequest(new
                {
                    message =
                        "This is a group streak request and must use the group acceptance flow."
                });
            }

            if (request.ReceiverId != currentUserId)
                return Forbid();

            if (request.Status != "Pending")
                return BadRequest("Request already handled.");

            var normalizedHabitName =
                request.HabitName.Trim().ToLower();

            var activeDuplicate =
                await _context.Streaks.FirstOrDefaultAsync(s =>
                    s.IsActive &&
                    (
                        (
                            s.UserOneId == request.SenderId &&
                            s.UserTwoId == request.ReceiverId
                        ) ||
                        (
                            s.UserOneId == request.ReceiverId &&
                            s.UserTwoId == request.SenderId
                        )
                    ) &&
                    s.HabitName.Trim().ToLower() ==
                        normalizedHabitName
                );

            if (activeDuplicate != null)
            {
                request.Status = "Rejected";
                await _context.SaveChangesAsync();

                return Conflict(new
                {
                    message =
                        "An active version of this streak already exists.",
                    existingStreakId = activeDuplicate.Id
                });
            }

            var nowUtc = DateTime.UtcNow;
            var defaultDate = new DateTime(1900, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            var oldDeadStreaks = await _context.Streaks
                .Where(s =>
                    !s.IsActive &&
                    s.HabitName == request.HabitName &&
                    (
                        (s.UserOneId == request.SenderId && s.UserTwoId == request.ReceiverId) ||
                        (s.UserOneId == request.ReceiverId && s.UserTwoId == request.SenderId)
                    ))
                .ToListAsync();

            if (oldDeadStreaks.Any())
            {
                _context.Streaks.RemoveRange(oldDeadStreaks);
            }

            Console.WriteLine(
                "[STREAK ACCEPT] " +
                $"RequestId={request.Id}, " +
                $"Sender={request.SenderId}, " +
                $"Receiver={request.ReceiverId}, " +
                $"Habit={request.HabitName}"
            );

            var streak = new Streak
            {
                UserOneId = request.SenderId,
                UserTwoId = request.ReceiverId,

                CreatedByUserId = request.SenderId,
                IsGroupStreak = false,

                HabitName = request.HabitName,
                HabitIcon = request.HabitIcon,
                Color = request.Color,

                RequiredCheckIns = request.RequiredCheckIns,
                CycleLength = request.CycleLength,
                CycleUnit = request.CycleUnit,

                CurrentCount = 0,
                IsActive = true,
                StreakRequestId = request.Id,
                StartedAt = nowUtc,
                CycleTrackingStartedAt = nowUtc,
                LastCompletedAt = defaultDate,
                FailedAt = defaultDate,
                IntervalHours = 24
            };

            _context.Streaks.Add(streak);
            request.Status = "Accepted";

            /*
             * Keep the new StreakRequestMember representation
             * synchronized with the legacy two-person request.
             */
            var requestMember = await _context.StreakRequestMembers
                .FirstOrDefaultAsync(member =>
                    member.StreakRequestId == request.Id &&
                    member.UserId == request.ReceiverId
                );

            if (requestMember != null)
            {
                requestMember.Status = "Accepted";
                requestMember.RespondedAt = nowUtc;
            }

            // First save creates the Streak row and gives streak.Id
            // its database-generated value.
            await _context.SaveChangesAsync();

            // Every streak now gets StreakMember records.
            // Existing two-person controller logic can continue using
            // UserOneId and UserTwoId while the application is gradually
            // migrated to the member-based architecture.
            var streakMembers = new List<StreakMember>
            {
                new StreakMember
                {
                    StreakId = streak.Id,
                    UserId = request.SenderId,
                    IsCreator = true,
                    VisibilityPublic = streak.UserOneVisibilityPublic,
                    JoinedAt = nowUtc
                },
                new StreakMember
                {
                    StreakId = streak.Id,
                    UserId = request.ReceiverId,
                    IsCreator = false,
                    VisibilityPublic = streak.UserTwoVisibilityPublic,
                    JoinedAt = nowUtc
                }
            };

            _context.StreakMembers.AddRange(streakMembers);

            await _context.SaveChangesAsync();

            return Ok(streak);
        }

        // POST api/streakrequests/reject/{requestId}
        [HttpPost("reject/{requestId}")]
        public async Task<IActionResult> RejectStreakRequest(int requestId)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var request = await _context.StreakRequests
                .FirstOrDefaultAsync(sr => sr.Id == requestId);

            if (request == null)
                return NotFound("Streak request not found.");

            if (request.IsGroupRequest)
            {
                return BadRequest(new
                {
                    message =
                        "This is a group streak request and must use the group rejection flow."
                });
            }

            if (request.ReceiverId != currentUserId)
                return Forbid();

            if (request.Status != "Pending")
                return BadRequest("Request already handled.");

            request.Status = "Rejected";

            var requestMember = await _context.StreakRequestMembers
                .FirstOrDefaultAsync(member =>
                    member.StreakRequestId == request.Id &&
                    member.UserId == request.ReceiverId
                );

            if (requestMember != null)
            {
                requestMember.Status = "Rejected";
                requestMember.RespondedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Streak request rejected",
                requestId = request.Id
            });
        }

        [HttpPost("group/{requestId}/accept")]
        public async Task<IActionResult> AcceptGroupStreakRequest(int requestId)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var request = await _context.StreakRequests
                .Include(sr => sr.Members)
                .FirstOrDefaultAsync(sr => sr.Id == requestId);

            if (request == null)
                return NotFound("Streak request not found.");

            if (!request.IsGroupRequest)
            {
                return BadRequest(new
                {
                    message = "This is not a group streak request."
                });
            }

            if (request.Status != "Pending")
            {
                return BadRequest(new
                {
                    message = "This group streak request is no longer pending."
                });
            }

            var member = request.Members
                .FirstOrDefault(m => m.UserId == currentUserId);

            if (member == null)
                return Forbid();

            if (member.Status == "Rejected")
            {
                return BadRequest(new
                {
                    message = "You already rejected this group streak request."
                });
            }

            if (member.Status == "Accepted")
            {
                return Ok(new
                {
                    message = "You already accepted this group streak request.",
                    requestId = request.Id
                });
            }

            member.Status = "Accepted";
            member.RespondedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var allAccepted = request.Members.All(
                m => m.Status == "Accepted"
            );

            if (!allAccepted)
            {
                return Ok(new
                {
                    message = "Group streak request accepted. Waiting for the remaining members.",
                    requestId = request.Id,
                    allAccepted = false
                });
            }

            /*
             * Everyone accepted.
             * Only now do we create the active group streak.
             */
            var nowUtc = DateTime.UtcNow;

            var defaultDate = new DateTime(
                1900,
                1,
                1,
                0,
                0,
                0,
                DateTimeKind.Utc
            );

            var streak = new Streak
            {
                /*
                 * These legacy fields remain populated temporarily
                 * for compatibility with existing controller code.
                 *
                 * Group-aware logic will migrate away from relying
                 * on these two fields.
                 */
                UserOneId = request.SenderId,
                UserTwoId = request.Members.First().UserId,

                CreatedByUserId = request.SenderId,
                IsGroupStreak = true,

                HabitName = request.HabitName,
                HabitIcon = request.HabitIcon,
                Color = request.Color,

                RequiredCheckIns = request.RequiredCheckIns,
                CycleLength = request.CycleLength,
                CycleUnit = request.CycleUnit,

                CurrentCount = 0,
                IsActive = true,

                StreakRequestId = request.Id,

                StartedAt = nowUtc,
                CycleTrackingStartedAt = nowUtc,

                LastCompletedAt = defaultDate,
                FailedAt = defaultDate,

                IntervalHours = 24
            };

            _context.Streaks.Add(streak);

            request.Status = "Accepted";

            await _context.SaveChangesAsync();

            /*
             * Add the creator.
             */
            var streakMembers = new List<StreakMember>
    {
        new StreakMember
        {
            StreakId = streak.Id,
            UserId = request.SenderId,
            IsCreator = true,
            VisibilityPublic = true,
            JoinedAt = nowUtc
        }
    };

            /*
             * Add every invited member.
             */
            streakMembers.AddRange(
                request.Members.Select(memberRequest =>
                    new StreakMember
                    {
                        StreakId = streak.Id,
                        UserId = memberRequest.UserId,
                        IsCreator = false,
                        VisibilityPublic = true,
                        JoinedAt = nowUtc
                    }
                )
            );

            _context.StreakMembers.AddRange(streakMembers);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Everyone accepted. Group streak created.",
                requestId = request.Id,
                streakId = streak.Id,
                allAccepted = true
            });
        }

        [HttpPost("group/{requestId}/reject")]
        public async Task<IActionResult> RejectGroupStreakRequest(int requestId)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var request = await _context.StreakRequests
                .Include(sr => sr.Members)
                .FirstOrDefaultAsync(sr => sr.Id == requestId);

            if (request == null)
                return NotFound("Streak request not found.");

            if (!request.IsGroupRequest)
            {
                return BadRequest(new
                {
                    message = "This is not a group streak request."
                });
            }

            if (request.Status != "Pending")
            {
                return BadRequest(new
                {
                    message = "This group streak request is no longer pending."
                });
            }

            var member = request.Members
                .FirstOrDefault(m => m.UserId == currentUserId);

            if (member == null)
                return Forbid();

            member.Status = "Rejected";
            member.RespondedAt = DateTime.UtcNow;

            /*
             * One rejection kills the entire pending group request.
             */
            request.Status = "Rejected";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Group streak request rejected. The group streak will not be created.",
                requestId = request.Id,
                rejectedByUserId = currentUserId
            });
        }
    }
}