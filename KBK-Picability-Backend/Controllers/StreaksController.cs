using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.DTOs;
using Picability.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Picability.Services;

namespace Picability.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StreaksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PushNotificationService _pushNotificationService;

        public StreaksController(
            ApplicationDbContext context,
            PushNotificationService pushNotificationService)
        {
            _context = context;
            _pushNotificationService = pushNotificationService;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        private static TimeZoneInfo GetPacificTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time"); // Windows/Azure
            }
            catch
            {
                return TimeZoneInfo.FindSystemTimeZoneById("America/Los_Angeles"); // Linux/Mac
            }
        }

        private static DateTime ToPacificDate(DateTime utcDateTime)
        {
            var pacificZone = GetPacificTimeZone();
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc), pacificZone).Date;
        }

        private static DateTime GetPacificToday(DateTime nowUtc)
        {
            var pacificZone = GetPacificTimeZone();
            return TimeZoneInfo.ConvertTimeFromUtc(nowUtc, pacificZone).Date;
        }

        private static int GetHoursUntilPacificMidnight(DateTime nowUtc)
        {
            var pacificZone = GetPacificTimeZone();
            var nowPacific = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, pacificZone);
            var nextMidnightPacific = nowPacific.Date.AddDays(1);
            return Math.Max(0, (int)Math.Ceiling((nextMidnightPacific - nowPacific).TotalHours));
        }

        // MODIFIED BY REECE
        // Before: Fetched streaks, dead streaks remained in the database as active
        // After: When fetching streaks, we check if any should be marked as failed based 
        // on the last completed date using a foreach loop. This way, dead streaks are automatically marked as 
        // inactive without needing a separate cleanup process.
        [HttpGet("mine")]
        public async Task<IActionResult> GetMyStreaks()
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var streaks = await _context.Streaks
                .Include(s => s.UserOne)
                .Include(s => s.UserTwo)
                .Include(s => s.Members)
                    .ThenInclude(member => member.User)
                .Where(s =>
                    s.Members.Any(member => member.UserId == userId) ||
                    s.UserOneId == userId ||
                    s.UserTwoId == userId
                )
                .ToListAsync();

            var streakIds = streaks
                .Select(s => s.Id)
                .ToList();

            var checkIns = await _context.StreakCheckIns
                .Where(checkIn =>
                    streakIds.Contains(checkIn.StreakId)
                )
                .ToListAsync();

            var nowUtc = DateTime.UtcNow;
            var pacificTimeZone = GetPacificTimeZone();
            var todayPacific = GetPacificToday(nowUtc);
            var hoursUntilMidnight =
                GetHoursUntilPacificMidnight(nowUtc);

            var defaultDate = new DateTime(
                1900,
                1,
                1,
                0,
                0,
                0,
                DateTimeKind.Utc
            );

            var changesMade = false;

            /*
             * Evaluate the most recently completed cycle.
             * Every member must have completed the requirement.
             */
            foreach (var streak in streaks.Where(s => s.IsActive))
            {
                var requiredCheckIns = Math.Max(
                    1,
                    streak.RequiredCheckIns
                );

                var cycleLength = Math.Max(
                    1,
                    streak.CycleLength
                );

                var cycleUnit =
                    streak.CycleUnit?.Trim().ToLowerInvariant() switch
                    {
                        "week" => "Week",
                        "month" => "Month",
                        _ => "Day"
                    };

                var currentCycle =
                    StreakCycleCalculator.GetCurrentCycle(
                        streak.StartedAt,
                        nowUtc,
                        cycleLength,
                        cycleUnit,
                        pacificTimeZone
                    );

                if (
                    streak.CycleTrackingStartedAt >=
                    currentCycle.StartUtc
                )
                {
                    continue;
                }

                var previousCycle =
                    StreakCycleCalculator.GetPreviousCycle(
                        streak.StartedAt,
                        currentCycle.StartUtc,
                        cycleLength,
                        cycleUnit,
                        pacificTimeZone
                    );

                /*
                 * Do not judge a partial first cycle.
                 */
                if (
                    streak.CycleTrackingStartedAt >
                    previousCycle.StartUtc
                )
                {
                    continue;
                }

                var memberIds = streak.Members
                    .Select(member => member.UserId)
                    .Distinct()
                    .ToList();

                /*
                 * Transitional fallback for a legacy streak that somehow
                 * does not yet have StreakMember rows.
                 */
                if (memberIds.Count == 0)
                {
                    memberIds.Add(streak.UserOneId);
                    memberIds.Add(streak.UserTwoId);
                }

                var allMembersCompletedPreviousCycle =
                    memberIds.All(memberId =>
                    {
                        var count = checkIns.Count(checkIn =>
                            checkIn.StreakId == streak.Id &&
                            checkIn.UserId == memberId &&
                            checkIn.CheckedInAt >=
                                previousCycle.StartUtc &&
                            checkIn.CheckedInAt <
                                previousCycle.EndUtc
                        );

                        /*
                         * Preserve legacy timestamp support for the
                         * original two users.
                         */
                        if (
                            count == 0 &&
                            memberId == streak.UserOneId &&
                            streak.UserOneLastCheckedInAt.HasValue &&
                            streak.UserOneLastCheckedInAt.Value >=
                                previousCycle.StartUtc &&
                            streak.UserOneLastCheckedInAt.Value <
                                previousCycle.EndUtc
                        )
                        {
                            count = 1;
                        }

                        if (
                            count == 0 &&
                            memberId == streak.UserTwoId &&
                            streak.UserTwoLastCheckedInAt.HasValue &&
                            streak.UserTwoLastCheckedInAt.Value >=
                                previousCycle.StartUtc &&
                            streak.UserTwoLastCheckedInAt.Value <
                                previousCycle.EndUtc
                        )
                        {
                            count = 1;
                        }

                        return count >= requiredCheckIns;
                    });

                if (!allMembersCompletedPreviousCycle)
                {
                    streak.IsActive = false;
                    streak.FailedAt = previousCycle.EndUtc;
                    changesMade = true;
                }
            }

            if (changesMade)
                await _context.SaveChangesAsync();

            var result = streaks.Select(streak =>
            {
                var requiredCheckIns = Math.Max(
                    1,
                    streak.RequiredCheckIns
                );

                var cycleLength = Math.Max(
                    1,
                    streak.CycleLength
                );

                var cycleUnit =
                    streak.CycleUnit?.Trim().ToLowerInvariant() switch
                    {
                        "week" => "Week",
                        "month" => "Month",
                        _ => "Day"
                    };

                var cycle =
                    StreakCycleCalculator.GetCurrentCycle(
                        streak.StartedAt,
                        nowUtc,
                        cycleLength,
                        cycleUnit,
                        pacificTimeZone
                    );

                var memberModels = streak.Members
                    .OrderByDescending(member => member.IsCreator)
                    .ThenBy(member => member.JoinedAt)
                    .ToList();

                /*
                 * Legacy fallback. Every new streak should already have
                 * StreakMember rows.
                 */
                if (memberModels.Count == 0)
                {
                    memberModels = new List<StreakMember>
            {
                new StreakMember
                {
                    StreakId = streak.Id,
                    UserId = streak.UserOneId,
                    User = streak.UserOne,
                    IsCreator = true,
                    VisibilityPublic =
                        streak.UserOneVisibilityPublic
                },
                new StreakMember
                {
                    StreakId = streak.Id,
                    UserId = streak.UserTwoId,
                    User = streak.UserTwo,
                    IsCreator = false,
                    VisibilityPublic =
                        streak.UserTwoVisibilityPublic
                }
            };
                }

                var memberProgress = memberModels
                    .Select(member =>
                    {
                        var count = checkIns.Count(checkIn =>
                            checkIn.StreakId == streak.Id &&
                            checkIn.UserId == member.UserId &&
                            checkIn.CheckedInAt >= cycle.StartUtc &&
                            checkIn.CheckedInAt < cycle.EndUtc
                        );

                        if (
                            count == 0 &&
                            member.UserId == streak.UserOneId &&
                            streak.UserOneLastCheckedInAt.HasValue &&
                            streak.UserOneLastCheckedInAt.Value >=
                                cycle.StartUtc &&
                            streak.UserOneLastCheckedInAt.Value <
                                cycle.EndUtc
                        )
                        {
                            count = 1;
                        }

                        if (
                            count == 0 &&
                            member.UserId == streak.UserTwoId &&
                            streak.UserTwoLastCheckedInAt.HasValue &&
                            streak.UserTwoLastCheckedInAt.Value >=
                                cycle.StartUtc &&
                            streak.UserTwoLastCheckedInAt.Value <
                                cycle.EndUtc
                        )
                        {
                            count = 1;
                        }

                        return new
                        {
                            UserId = member.UserId,

                            UserName =
                                member.User?.UserName ??
                                "Unknown user",

                            IsCreator = member.IsCreator,

                            IsCurrentUser =
                                member.UserId == userId,

                            CycleCheckInCount = count,

                            CompletedCycle =
                                count >= requiredCheckIns,

                            VisibilityPublic =
                                member.VisibilityPublic
                        };
                    })
                    .ToList();

                var currentMember = memberProgress
                    .First(member =>
                        member.UserId == userId
                    );

                var otherMembers = memberProgress
                    .Where(member =>
                        member.UserId != userId
                    )
                    .ToList();

                var firstOtherMember =
                    otherMembers.FirstOrDefault();

                var allMembersCompletedCycle =
                    memberProgress.All(member =>
                        member.CompletedCycle
                    );

                var waitingOnMembers = memberProgress
                    .Where(member =>
                        !member.CompletedCycle
                    )
                    .Select(member => new
                    {
                        member.UserId,
                        member.UserName,
                        member.IsCurrentUser
                    })
                    .ToList();

                var hoursUntilCycleEnds = Math.Max(
                    0,
                    (int)Math.Ceiling(
                        (cycle.EndUtc - nowUtc).TotalHours
                    )
                );

                var cycleUnitDisplay = cycleUnit switch
                {
                    "Week" => cycleLength == 1
                        ? "week"
                        : $"{cycleLength}-week cycle",

                    "Month" => cycleLength == 1
                        ? "month"
                        : $"{cycleLength}-month cycle",

                    _ => cycleLength == 1
                        ? "day"
                        : $"{cycleLength}-day cycle"
                };

                var cycleProgressMessage =
                    $"{currentMember.CycleCheckInCount} of " +
                    $"{requiredCheckIns} check-ins this " +
                    $"{cycleUnitDisplay}";

                string? brokenMessage = null;
                var failedMembers = new List<object>();

                if (
                    !streak.IsActive &&
                    streak.FailedAt.HasValue &&
                    streak.FailedAt.Value != defaultDate
                )
                {
                    var failedCycle =
                        StreakCycleCalculator.GetCurrentCycle(
                            streak.StartedAt,
                            streak.FailedAt.Value.AddTicks(-1),
                            cycleLength,
                            cycleUnit,
                            pacificTimeZone
                        );

                    var failedMemberData = memberModels
                        .Select(member =>
                        {
                            var count = checkIns.Count(checkIn =>
                                checkIn.StreakId == streak.Id &&
                                checkIn.UserId == member.UserId &&
                                checkIn.CheckedInAt >=
                                    failedCycle.StartUtc &&
                                checkIn.CheckedInAt <
                                    failedCycle.EndUtc
                            );

                            return new
                            {
                                member.UserId,

                                UserName =
                                    member.User?.UserName ??
                                    "Unknown user",

                                IsCurrentUser =
                                    member.UserId == userId,

                                Count = count
                            };
                        })
                        .Where(member =>
                            member.Count < requiredCheckIns
                        )
                        .ToList();

                    failedMembers.AddRange(
                        failedMemberData.Select(member =>
                            (object)new
                            {
                                member.UserId,
                                member.UserName,
                                member.IsCurrentUser
                            }
                        )
                    );

                    var failedNames = failedMemberData
                        .Select(member =>
                            member.IsCurrentUser
                                ? "You"
                                : member.UserName
                        )
                        .ToList();

                    brokenMessage = failedNames.Count switch
                    {
                        0 => "The streak ended.",
                        1 => $"{failedNames[0]} killed the streak.",
                        2 => $"{failedNames[0]} and {failedNames[1]} killed the streak.",
                        _ =>
                            $"{string.Join(", ", failedNames.Take(failedNames.Count - 1))}, and {failedNames.Last()} killed the streak."
                    };
                }

                var currentUserCheckedInToday =
                    checkIns.Any(checkIn =>
                        checkIn.StreakId == streak.Id &&
                        checkIn.UserId == userId &&
                        ToPacificDate(checkIn.CheckedInAt) ==
                            todayPacific
                    );

                var partnerCheckInCount =
                    firstOtherMember?.CycleCheckInCount ?? 0;

                var partnerCompletedCycle =
                    otherMembers.Count > 0 &&
                    otherMembers.All(member =>
                        member.CompletedCycle
                    );

                var currentMemberModel = memberModels
                    .First(member =>
                        member.UserId == userId
                    );

                return new
                {
                    streak.Id,
                    streak.HabitName,
                    streak.HabitIcon,
                    streak.Color,
                    streak.CurrentCount,
                    streak.IsActive,
                    streak.IsGroupStreak,

                    MemberCount = memberProgress.Count,
                    Members = memberProgress,

                    WaitingOnMembers =
                        waitingOnMembers,

                    FailedMembers =
                        failedMembers,

                    AllMembersCompletedCycle =
                        allMembersCompletedCycle,

                    RequiredCheckIns =
                        requiredCheckIns,

                    CycleLength =
                        cycleLength,

                    CycleUnit =
                        cycleUnit,

                    CycleStartedAt =
                        cycle.StartUtc,

                    CycleEndsAt =
                        cycle.EndUtc,

                    UserCycleCheckInCount =
                        currentMember.CycleCheckInCount,

                    UserCompletedCycle =
                        currentMember.CompletedCycle,

                    CanCheckInCurrentCycle =
                        streak.IsActive &&
                        !currentMember.CompletedCycle,

                    HoursUntilCycleEnds =
                        hoursUntilCycleEnds,

                    IsPublic =
                        currentMemberModel.VisibilityPublic,

                    CycleProgressMessage =
                        cycleProgressMessage,

                    streak.LastCompletedAt,
                    streak.LastFullyCompletedAt,
                    streak.UserOneLastCheckedInAt,
                    streak.UserTwoLastCheckedInAt,

                    BrokenMessage =
                        brokenMessage,

                    streak.StartedAt,

                    /*
                     * Legacy two-person response fields remain available
                     * while the frontend is being migrated.
                     */
                    PartnerName =
                        firstOtherMember?.UserName ??
                        "Group",

                    PartnerId =
                        firstOtherMember?.UserId,

                    PartnerCycleCheckInCount =
                        partnerCheckInCount,

                    PartnerCompletedCycle =
                        partnerCompletedCycle,

                    BothCompletedCycle =
                        allMembersCompletedCycle,

                    UserCheckedInToday =
                        currentUserCheckedInToday,

                    PartnerCheckedInToday =
                        otherMembers.Any(member =>
                            member.CycleCheckInCount > 0
                        ),

                    BothCheckedInToday =
                        memberProgress.All(member =>
                            member.CycleCheckInCount > 0
                        ),

                    CanCheckInToday =
                        streak.IsActive &&
                        !currentMember.CompletedCycle,

                    HoursUntilMidnight =
                        hoursUntilMidnight,

                    TimeMessage =
                        currentMember.CompletedCycle
                            ? allMembersCompletedCycle
                                ? "Completed"
                                : "Your part is complete. Waiting on the remaining members."
                            : $"{currentMember.CycleCheckInCount} of {requiredCheckIns} check-ins complete this cycle."
                };
            });

            return Ok(result);
        }

        // ADDED BY REECE
        // Before: Dead streaks remained in the database and the UI
        // After: Allows the frontend to dismiss a streak and remove it
        // from the database, also clearing it from the UI.
        [HttpDelete("{id}/dismiss")]
        public async Task<IActionResult> DismissStreak(int id)
        {
            var currentUserId = GetCurrentUserId();

            var streak = await _context.Streaks.FirstOrDefaultAsync(s =>
                s.Id == id &&
                (s.UserOneId == currentUserId || s.UserTwoId == currentUserId));

            if (streak == null)
            {
                return NotFound("Streak not found.");
            }

            _context.Streaks.Remove(streak);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Streak dismissed and removed from database." });
        }

        // ADDED BY REECE
        // Before: Removing a friend did not affect streaks. They would
        // remain in the database and UI.
        // After: Removing a friend also removes any streaks between the
        // users, also cleaning the UI.
        [HttpDelete("remove-connection/{friendId}")]
        public async Task<IActionResult> RemoveFriendStreaks(string friendId)
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var sharedStreaks = await _context.Streaks
                .Where(s => (s.UserOneId == userId && s.UserTwoId == friendId) ||
                            (s.UserOneId == friendId && s.UserTwoId == userId))
                .ToListAsync();

            var sharedRequests = await _context.StreakRequests
                .Where(sr => (sr.SenderId == userId && sr.ReceiverId == friendId) ||
                             (sr.SenderId == friendId && sr.ReceiverId == userId))
                .ToListAsync();

            if (sharedStreaks.Any())
            {
                _context.Streaks.RemoveRange(sharedStreaks);
            }
            if (sharedRequests.Any())
            {
                _context.StreakRequests.RemoveRange(sharedRequests);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Shared streaks removed." });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var currentUserId = GetCurrentUserId();

            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized();
            }

            var streak = await _context.Streaks
                .Include(s => s.UserOne)
                .Include(s => s.UserTwo)
                .FirstOrDefaultAsync(s =>
                    s.Id == id &&
                    (s.UserOneId == currentUserId || s.UserTwoId == currentUserId));

            if (streak == null) return NotFound("Streak not found.");
            return Ok(streak);
        }

        public class UpdateStreakVisibilityDto
        {
            public bool IsPublic { get; set; }
        }

        [HttpPut("{id}/visibility")]
        public async Task<IActionResult> UpdateVisibility(int id, UpdateStreakVisibilityDto dto)
        {
            var currentUserId = GetCurrentUserId();

            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized();
            }

            var streak = await _context.Streaks.FirstOrDefaultAsync(s =>
                s.Id == id &&
                (s.UserOneId == currentUserId || s.UserTwoId == currentUserId));

            if (streak == null)
            {
                return NotFound("Streak not found.");
            }

            if (streak.UserOneId == currentUserId)
            {
                streak.UserOneVisibilityPublic = dto.IsPublic;
            }
            else if (streak.UserTwoId == currentUserId)
            {
                streak.UserTwoVisibilityPublic = dto.IsPublic;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                streak.Id,
                IsPublic = dto.IsPublic,
                message = dto.IsPublic
                    ? "Streak is now public."
                    : "Streak is now private."
            });
        }

        private static string GetStreakKillerName(Streak streak, string viewingFriendId)
        {
            if (!streak.FailedAt.HasValue)
            {
                return "Unknown";
            }

            var failedPacificDate = ToPacificDate(streak.FailedAt.Value);
            var missedPacificDate = failedPacificDate.AddDays(-1);

            var userOneCheckedMissedDay =
                streak.UserOneLastCheckedInAt.HasValue &&
                ToPacificDate(streak.UserOneLastCheckedInAt.Value) == missedPacificDate;

            var userTwoCheckedMissedDay =
                streak.UserTwoLastCheckedInAt.HasValue &&
                ToPacificDate(streak.UserTwoLastCheckedInAt.Value) == missedPacificDate;

            if (!userOneCheckedMissedDay && userTwoCheckedMissedDay)
            {
                return streak.UserOne.UserName ?? "User One";
            }

            if (userOneCheckedMissedDay && !userTwoCheckedMissedDay)
            {
                return streak.UserTwo.UserName ?? "User Two";
            }

            return "Both users";
        }

        [HttpGet("public-feed")]
        public async Task<IActionResult> GetPublicFeed()
        {
            var currentUserId = GetCurrentUserId();

            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized();
            }

            var nowUtc = DateTime.UtcNow;
            var todayPacific = GetPacificToday(nowUtc);

            var friendIds = await _context.FriendRequests
                .Where(fr =>
                    fr.Status == "Accepted" &&
                    (fr.SenderId == currentUserId || fr.ReceiverId == currentUserId))
                .Select(fr => fr.SenderId == currentUserId ? fr.ReceiverId : fr.SenderId)
                .Distinct()
                .ToListAsync();

            var streaks = await _context.Streaks
                .Include(s => s.UserOne)
                .Include(s => s.UserTwo)
                .Where(s =>
                    friendIds.Contains(s.UserOneId) ||
                    friendIds.Contains(s.UserTwoId))
                .ToListAsync();

            var streakIds = streaks.Select(s => s.Id).ToList();

            var reactions = await _context.StreakReactions
                .Include(r => r.User)
                .Where(r => streakIds.Contains(r.StreakId))
                .ToListAsync();

            var result = streaks
                            .SelectMany(s =>
                {
                    var feedItems = new List<object>();

                    var completedToday =
                        s.IsActive &&
                        s.LastFullyCompletedAt.HasValue &&
                        ToPacificDate(s.LastFullyCompletedAt.Value) == todayPacific;

                    var failedToday =
                        !s.IsActive &&
                        s.FailedAt.HasValue &&
                        ToPacificDate(s.FailedAt.Value) == todayPacific;

                    if (!completedToday && !failedToday)
                    {
                        return feedItems;
                    }

                    var userOneVisibleToMe = friendIds.Contains(s.UserOneId) && s.UserOneVisibilityPublic;
                    var userTwoVisibleToMe = friendIds.Contains(s.UserTwoId) && s.UserTwoVisibilityPublic;

                    if (userOneVisibleToMe || userTwoVisibleToMe)
                    {
                        var displayFriendIsUserOne = userOneVisibleToMe;

                        feedItems.Add(new
                        {
                            s.Id,
                            s.HabitName,
                            s.HabitIcon,
                            s.Color,
                            s.CurrentCount,
                            s.IsActive,
                            FriendName = displayFriendIsUserOne ? s.UserOne.UserName : s.UserTwo.UserName,
                            PartnerName = displayFriendIsUserOne ? s.UserTwo.UserName : s.UserOne.UserName,
                            CompletedToday = completedToday,
                            FailedToday = failedToday,
                            s.LastFullyCompletedAt,
                            s.FailedAt,
                            KilledBy = failedToday
                                ? GetStreakKillerName(s, displayFriendIsUserOne ? s.UserOneId : s.UserTwoId)
                                : null,
                            ReactionType = failedToday ? "HeartBreak" : "FistBump",
                            ReactionEmoji = failedToday ? "💔" : "👊",
                            ReactionCount = reactions.Count(r =>
                                r.StreakId == s.Id &&
                                r.ReactionType == (failedToday ? "HeartBreak" : "FistBump")),
                            CurrentUserReacted = reactions.Any(r =>
                                r.StreakId == s.Id &&
                                r.UserId == currentUserId &&
                                r.ReactionType == (failedToday ? "HeartBreak" : "FistBump"))
                        });
                    }

                    return feedItems;
                })
                .OrderByDescending(item => item.GetType().GetProperty("LastFullyCompletedAt")?.GetValue(item)
                    ?? item.GetType().GetProperty("FailedAt")?.GetValue(item))
                .ToList();

            return Ok(result);
        }

        [HttpPost("{id}/react")]
        public async Task<IActionResult> ToggleReaction(int id)
        {
            var currentUserId = GetCurrentUserId();

            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized();
            }

            var streak = await _context.Streaks
                .FirstOrDefaultAsync(s => s.Id == id);

            if (streak == null)
            {
                return NotFound("Streak not found.");
            }

            var friendIds = await _context.FriendRequests
                .Where(fr =>
                    fr.Status == "Accepted" &&
                    (fr.SenderId == currentUserId || fr.ReceiverId == currentUserId))
                .Select(fr => fr.SenderId == currentUserId ? fr.ReceiverId : fr.SenderId)
                .Distinct()
                .ToListAsync();

            var isParticipant =
                streak.UserOneId == currentUserId ||
                streak.UserTwoId == currentUserId;

            var canSeePublicStreak =
                (friendIds.Contains(streak.UserOneId) && streak.UserOneVisibilityPublic) ||
                (friendIds.Contains(streak.UserTwoId) && streak.UserTwoVisibilityPublic);

            if (!isParticipant && !canSeePublicStreak)
            {
                return Forbid();
            }

            var reactionType = streak.IsActive ? "FistBump" : "HeartBreak";

            var existingReaction = await _context.StreakReactions
                .FirstOrDefaultAsync(r =>
                    r.StreakId == id &&
                    r.UserId == currentUserId);

            if (existingReaction != null)
            {
                _context.StreakReactions.Remove(existingReaction);
                await _context.SaveChangesAsync();

                var newCount = await _context.StreakReactions
                    .CountAsync(r => r.StreakId == id && r.ReactionType == reactionType);

                return Ok(new
                {
                    reacted = false,
                    reactionType,
                    reactionEmoji = reactionType == "HeartBreak" ? "💔" : "👊",
                    reactionCount = newCount
                });
            }

            var reaction = new StreakReaction
            {
                StreakId = id,
                UserId = currentUserId,
                ReactionType = reactionType,
                CreatedAt = DateTime.UtcNow
            };

            _context.StreakReactions.Add(reaction);
            await _context.SaveChangesAsync();

            var count = await _context.StreakReactions
                .CountAsync(r => r.StreakId == id && r.ReactionType == reactionType);

            return Ok(new
            {
                reacted = true,
                reactionType,
                reactionEmoji = reactionType == "HeartBreak" ? "💔" : "👊",
                reactionCount = count
            });
        }

        [HttpGet("{id}/reactions")]
        public async Task<IActionResult> GetReactions(int id)
        {
            var currentUserId = GetCurrentUserId();

            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized();
            }

            var streak = await _context.Streaks
                .FirstOrDefaultAsync(s => s.Id == id);

            if (streak == null)
            {
                return NotFound("Streak not found.");
            }

            var reactionType = streak.IsActive ? "FistBump" : "HeartBreak";

            var reactions = await _context.StreakReactions
                .Include(r => r.User)
                .Where(r => r.StreakId == id && r.ReactionType == reactionType)
                .OrderBy(r => r.User.UserName)
                .Select(r => new
                {
                    r.UserId,
                    UserName = r.User.UserName,
                    r.ReactionType,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                streakId = id,
                reactionType,
                reactionEmoji = reactionType == "HeartBreak" ? "💔" : "👊",
                count = reactions.Count,
                users = reactions
            });
        }

        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteStreak(
    int id,
    CompleteStreakDto dto)
        {
            var currentUserId = GetCurrentUserId();

            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            var streak = await _context.Streaks
                .Include(s => s.UserOne)
                .Include(s => s.UserTwo)
                .Include(s => s.Members)
                    .ThenInclude(member => member.User)
                .FirstOrDefaultAsync(s =>
                    s.Id == id &&
                    (
                        s.Members.Any(member =>
                            member.UserId == currentUserId
                        ) ||
                        s.UserOneId == currentUserId ||
                        s.UserTwoId == currentUserId
                    )
                );

            if (streak == null)
                return NotFound("Streak not found.");

            if (!streak.IsActive)
            {
                return BadRequest(
                    "This streak is no longer active."
                );
            }

            var memberModels = streak.Members
                .ToList();

            if (memberModels.Count == 0)
            {
                memberModels = new List<StreakMember>
        {
            new StreakMember
            {
                UserId = streak.UserOneId,
                User = streak.UserOne,
                IsCreator = true
            },
            new StreakMember
            {
                UserId = streak.UserTwoId,
                User = streak.UserTwo
            }
        };
            }

            var currentMember = memberModels
                .FirstOrDefault(member =>
                    member.UserId == currentUserId
                );

            if (currentMember == null)
                return Forbid();

            var nowUtc = DateTime.UtcNow;
            var timeZone = GetPacificTimeZone();

            var requiredCheckIns = Math.Max(
                1,
                streak.RequiredCheckIns
            );

            var cycleLength = Math.Max(
                1,
                streak.CycleLength
            );

            var cycleUnit =
                streak.CycleUnit?.Trim().ToLowerInvariant() switch
                {
                    "week" => "Week",
                    "month" => "Month",
                    _ => "Day"
                };

            var cycle =
                StreakCycleCalculator.GetCurrentCycle(
                    streak.StartedAt,
                    nowUtc,
                    cycleLength,
                    cycleUnit,
                    timeZone
                );

            var memberIds = memberModels
                .Select(member => member.UserId)
                .Distinct()
                .ToList();

            var cycleCheckIns = await _context.StreakCheckIns
                .Where(checkIn =>
                    checkIn.StreakId == streak.Id &&
                    memberIds.Contains(checkIn.UserId) &&
                    checkIn.CheckedInAt >= cycle.StartUtc &&
                    checkIn.CheckedInAt < cycle.EndUtc
                )
                .ToListAsync();

            var memberCounts = memberIds.ToDictionary(
                memberId => memberId,
                memberId => cycleCheckIns.Count(checkIn =>
                    checkIn.UserId == memberId
                )
            );

            /*
             * Preserve the two legacy timestamps during migration.
             */
            if (
                memberCounts.TryGetValue(
                    streak.UserOneId,
                    out var userOneCount
                ) &&
                userOneCount == 0 &&
                streak.UserOneLastCheckedInAt.HasValue &&
                streak.UserOneLastCheckedInAt.Value >=
                    cycle.StartUtc &&
                streak.UserOneLastCheckedInAt.Value <
                    cycle.EndUtc
            )
            {
                memberCounts[streak.UserOneId] = 1;
            }

            if (
                memberCounts.TryGetValue(
                    streak.UserTwoId,
                    out var userTwoCount
                ) &&
                userTwoCount == 0 &&
                streak.UserTwoLastCheckedInAt.HasValue &&
                streak.UserTwoLastCheckedInAt.Value >=
                    cycle.StartUtc &&
                streak.UserTwoLastCheckedInAt.Value <
                    cycle.EndUtc
            )
            {
                memberCounts[streak.UserTwoId] = 1;
            }

            var currentUserCheckInCount =
                memberCounts[currentUserId];

            if (currentUserCheckInCount >= requiredCheckIns)
            {
                return BadRequest(new
                {
                    message =
                        "You already completed all required check-ins for this cycle.",

                    currentCheckIns =
                        currentUserCheckInCount,

                    requiredCheckIns,

                    cycleEndsAt =
                        cycle.EndUtc
                });
            }

            var alreadyFullyCompletedThisCycle =
                streak.LastFullyCompletedAt.HasValue &&
                streak.LastFullyCompletedAt.Value >=
                    cycle.StartUtc &&
                streak.LastFullyCompletedAt.Value <
                    cycle.EndUtc;

            _context.StreakCheckIns.Add(
                new StreakCheckIn
                {
                    StreakId = streak.Id,
                    UserId = currentUserId,
                    CheckedInAt = nowUtc
                }
            );

            currentUserCheckInCount++;
            memberCounts[currentUserId] =
                currentUserCheckInCount;

            if (currentUserId == streak.UserOneId)
                streak.UserOneLastCheckedInAt = nowUtc;

            if (currentUserId == streak.UserTwoId)
                streak.UserTwoLastCheckedInAt = nowUtc;

            var currentUserCompletedCycle =
                currentUserCheckInCount >= requiredCheckIns;

            var allMembersCompletedCycle =
                memberCounts.Values.All(count =>
                    count >= requiredCheckIns
                );

            if (
                allMembersCompletedCycle &&
                !alreadyFullyCompletedThisCycle
            )
            {
                streak.CurrentCount++;
                streak.LastFullyCompletedAt = nowUtc;
                streak.LastCompletedAt = nowUtc;
            }

            await _context.SaveChangesAsync();

            var senderName =
                currentMember.User?.UserName ??
                "A group member";

            var recentContent =
                await _context.CheckInContents
                    .Where(content =>
                        content.StreakId == streak.Id &&
                        content.SenderId == currentUserId &&
                        !content.IsViewed &&
                        content.CreatedAt >=
                            nowUtc.AddMinutes(-5)
                    )
                    .ToListAsync();

            var sentMessage = recentContent.Any(content =>
                content.ContentType == "Message"
            );

            var sentPhoto = recentContent.Any(content =>
                content.ContentType == "Photo"
            );

            /*
             * Notify every other member.
             * Content recipient handling will be generalized separately.
             */
            foreach (
                var receiverId in memberIds.Where(memberId =>
                    memberId != currentUserId
                )
            )
            {
                await _pushNotificationService
                    .NotifyPartnerCheckedInAsync(
                        receiverId,
                        senderName,
                        streak.HabitName,
                        currentUserCheckInCount,
                        requiredCheckIns,
                        cycleLength,
                        cycleUnit,
                        sentMessage,
                        sentPhoto
                    );
            }

            var memberProgress = memberModels
                .Select(member => new
                {
                    UserId = member.UserId,

                    UserName =
                        member.User?.UserName ??
                        "Unknown user",

                    IsCreator =
                        member.IsCreator,

                    IsCurrentUser =
                        member.UserId == currentUserId,

                    CycleCheckInCount =
                        memberCounts[member.UserId],

                    CompletedCycle =
                        memberCounts[member.UserId] >=
                        requiredCheckIns
                })
                .ToList();

            var waitingOnMembers = memberProgress
                .Where(member =>
                    !member.CompletedCycle
                )
                .Select(member => new
                {
                    member.UserId,
                    member.UserName,
                    member.IsCurrentUser
                })
                .ToList();

            var hoursUntilCycleEnds = Math.Max(
                0,
                (int)Math.Ceiling(
                    (cycle.EndUtc - nowUtc).TotalHours
                )
            );

            return Ok(new
            {
                streak.Id,
                streak.CurrentCount,
                streak.IsGroupStreak,

                MemberCount =
                    memberProgress.Count,

                Members =
                    memberProgress,

                WaitingOnMembers =
                    waitingOnMembers,

                AllMembersCompletedCycle =
                    allMembersCompletedCycle,

                RequiredCheckIns =
                    requiredCheckIns,

                CycleLength =
                    cycleLength,

                CycleUnit =
                    cycleUnit,

                CycleStartedAt =
                    cycle.StartUtc,

                CycleEndsAt =
                    cycle.EndUtc,

                UserCycleCheckInCount =
                    currentUserCheckInCount,

                UserCompletedCycle =
                    currentUserCompletedCycle,

                BothCompletedCycle =
                    allMembersCompletedCycle,

                CanCheckInCurrentCycle =
                    currentUserCheckInCount <
                    requiredCheckIns,

                HoursUntilCycleEnds =
                    hoursUntilCycleEnds,

                streak.LastCompletedAt,
                streak.LastFullyCompletedAt,
                streak.UserOneLastCheckedInAt,
                streak.UserTwoLastCheckedInAt,

                UserCheckedInToday = true,

                BothCheckedInToday =
                    memberCounts.Values.All(count =>
                        count > 0
                    ),

                CanCheckInToday =
                    currentUserCheckInCount <
                    requiredCheckIns,

                TimeMessage =
                    allMembersCompletedCycle
                        ? "Completed"
                        : currentUserCompletedCycle
                            ? "Your part is complete. Waiting on the remaining members."
                            : $"{currentUserCheckInCount} of {requiredCheckIns} check-ins complete this cycle."
            });
        }
    }
}