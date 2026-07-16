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
        public async Task<IActionResult> SendStreakRequest(CreateStreakRequestDto dto)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            if (currentUserId == dto.ReceiverId)
                return BadRequest("You cannot send a streak request to yourself.");
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
                    message = "Required check-ins must be at least 1."
                });
            }

            if (dto.CycleLength < 1)
            {
                return BadRequest(new
                {
                    message = "Cycle length must be at least 1."
                });
            }

            if (normalizedCycleUnit == null)
            {
                return BadRequest(new
                {
                    message = "Cycle unit must be Day, Week, or Month."
                });
            }

            /*
             * Keep the first version within reasonable limits.
             * These limits can be expanded later without a database change.
             */
            if (dto.RequiredCheckIns > 100)
            {
                return BadRequest(new
                {
                    message = "Required check-ins cannot exceed 100 per cycle."
                });
            }

            if (dto.CycleLength > 365)
            {
                return BadRequest(new
                {
                    message = "Cycle length cannot exceed 365 units."
                });
            }

            // Verify friendship exists in the database
            bool areFriends = await _context.Friends.AnyAsync(f =>
                (f.UserId == currentUserId && f.FriendId == dto.ReceiverId) ||
                (f.UserId == dto.ReceiverId && f.FriendId == currentUserId));

            if (!areFriends)
                return BadRequest("Users must be friends before starting a streak.");

            var normalizedHabitName = dto.HabitName.Trim();

            if (string.IsNullOrWhiteSpace(normalizedHabitName))
            {
                return BadRequest(new
                {
                    message = "Habit name is required."
                });
            }

            var normalizedHabitNameLower =
                normalizedHabitName.ToLower();

            bool duplicatePending =
                await _context.StreakRequests.AnyAsync(sr =>
                    sr.Status == "Pending" &&
                    (
                        (
                            sr.SenderId == currentUserId &&
                            sr.ReceiverId == dto.ReceiverId
                        ) ||
                        (
                            sr.SenderId == dto.ReceiverId &&
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

            // Added check to prevent multiple active streaks for the same habit between the same users
            bool duplicateActive =
                await _context.Streaks.AnyAsync(s =>
            s.IsActive &&
            (
                (
                    s.UserOneId == currentUserId &&
                    s.UserTwoId == dto.ReceiverId
                ) ||
                (
                    s.UserOneId == dto.ReceiverId &&
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

            var request = new StreakRequest
            {
                SenderId = currentUserId,
                ReceiverId = dto.ReceiverId,
                HabitName = normalizedHabitName,
                HabitIcon = dto.HabitIcon,
                Color = dto.Color,

                RequiredCheckIns = dto.RequiredCheckIns,
                CycleLength = dto.CycleLength,
                CycleUnit = normalizedCycleUnit,

                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.StreakRequests.Add(request);
            await _context.SaveChangesAsync();

            var senderName = await _context.Users
                .Where(u => u.Id == currentUserId)
                .Select(u => u.UserName)
                .FirstOrDefaultAsync();

            await _pushNotificationService.NotifyStreakRequestAsync(
                dto.ReceiverId,
                senderName ?? "Your friend",
                normalizedHabitName
            );

            return Ok(request);
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

            var requests = await _context.StreakRequests
                .Include(sr => sr.Sender)
                .Where(r => r.ReceiverId == currentUserId && r.Status == "Pending")
               .Select(sr => new
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

                   SenderName = sr.Sender.UserName,
                   SenderId = sr.SenderId
               })
                .ToListAsync();

            return Ok(requests);
        }

        [HttpGet("outgoing")]
        public async Task<IActionResult> GetOutgoingRequests()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var requests = await _context.StreakRequests
                .Include(sr => sr.Receiver)
                .Where(r => r.SenderId == currentUserId && r.Status == "Pending")
                .Select(sr => new
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

                    ReceiverName = sr.Receiver.UserName,
                    ReceiverId = sr.ReceiverId
                })
                .ToListAsync();

            return Ok(requests);
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
                .Where(sr => sr.SenderId == currentUserId || sr.ReceiverId == currentUserId)
                .Select(sr => new
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
                    sr.CreatedAt
                })
                .ToListAsync();

            return Ok(requests);
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

            if (request.ReceiverId != currentUserId)
                return Forbid();

            if (request.Status != "Pending")
                return BadRequest("Request already handled.");

            request.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Streak request rejected", requestId = request.Id });
        }
    }
}