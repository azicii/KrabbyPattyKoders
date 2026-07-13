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
            {
                return Unauthorized();
            }

            var streaks = await _context.Streaks
                .Include(s => s.UserOne)
                .Include(s => s.UserTwo)
                .Where(s => s.UserOneId == userId || s.UserTwoId == userId)
                .ToListAsync();
            var streakIds = streaks
                .Select(s => s.Id)
                .ToList();
            var checkIns = await _context.StreakCheckIns
                .Where(c => streakIds.Contains(c.StreakId))
                .ToListAsync();
            var nowUtc = DateTime.UtcNow;
            var todayPacific = GetPacificToday(nowUtc);
            var hoursUntilMidnight = GetHoursUntilPacificMidnight(nowUtc);
            var defaultDate = new DateTime(
                1900,
                1,
                1,
                0,
                0,
                0,
                DateTimeKind.Utc
            );

            var pacificTimeZone = GetPacificTimeZone();
            bool changesMade = false;

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

                /*
                 * If the flexible-cycle tracking timestamp falls inside the
                 * current cycle, no tracked cycle has ended yet.
                 */
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
                 * Do not evaluate a cycle that ended entirely before flexible
                 * check-in tracking was introduced for this streak.
                 */
                if (
                    previousCycle.EndUtc <=
                    streak.CycleTrackingStartedAt
                )
                {
                    continue;
                }

                var userOneCheckInCount = checkIns.Count(c =>
                    c.StreakId == streak.Id &&
                    c.UserId == streak.UserOneId &&
                    c.CheckedInAt >= previousCycle.StartUtc &&
                    c.CheckedInAt < previousCycle.EndUtc
                );

                var userTwoCheckInCount = checkIns.Count(c =>
                    c.StreakId == streak.Id &&
                    c.UserId == streak.UserTwoId &&
                    c.CheckedInAt >= previousCycle.StartUtc &&
                    c.CheckedInAt < previousCycle.EndUtc
                );

                /*
                 * Preserve one legacy check-in for streaks transitioning from
                 * the old timestamp-only implementation.
                 */
                if (
                    userOneCheckInCount == 0 &&
                    streak.UserOneLastCheckedInAt.HasValue &&
                    streak.UserOneLastCheckedInAt.Value >=
                        previousCycle.StartUtc &&
                    streak.UserOneLastCheckedInAt.Value <
                        previousCycle.EndUtc
                )
                {
                    userOneCheckInCount = 1;
                }

                if (
                    userTwoCheckInCount == 0 &&
                    streak.UserTwoLastCheckedInAt.HasValue &&
                    streak.UserTwoLastCheckedInAt.Value >=
                        previousCycle.StartUtc &&
                    streak.UserTwoLastCheckedInAt.Value <
                        previousCycle.EndUtc
                )
                {
                    userTwoCheckInCount = 1;
                }

                var userOneCompletedCycle =
                    userOneCheckInCount >= requiredCheckIns;

                var userTwoCompletedCycle =
                    userTwoCheckInCount >= requiredCheckIns;

                if (
                    !userOneCompletedCycle ||
                    !userTwoCompletedCycle
                )
                {
                    streak.IsActive = false;

                    /*
                     * Store the boundary at which the streak officially broke,
                     * rather than the later moment at which the API noticed it.
                     */
                    streak.FailedAt = previousCycle.EndUtc;

                    changesMade = true;
                }
            }

            if (changesMade)
            {
                await _context.SaveChangesAsync();
            }

            var result = streaks.Select(s =>
            {
                var isUserOne = s.UserOneId == userId;
                var requiredCheckIns = Math.Max(1, s.RequiredCheckIns);
                var cycleLength = Math.Max(1, s.CycleLength);

                var cycleUnit = s.CycleUnit?.Trim().ToLowerInvariant() switch
                {
                    "week" => "Week",
                    "month" => "Month",
                    _ => "Day"
                };

                var cycle = StreakCycleCalculator.GetCurrentCycle(
                    s.StartedAt,
                    nowUtc,
                    cycleLength,
                    cycleUnit,
                    GetPacificTimeZone()
                );

                var userOneCycleCheckInCount = checkIns.Count(c =>
                    c.StreakId == s.Id &&
                    c.UserId == s.UserOneId &&
                    c.CheckedInAt >= cycle.StartUtc &&
                    c.CheckedInAt < cycle.EndUtc
                );

                var userTwoCycleCheckInCount = checkIns.Count(c =>
                    c.StreakId == s.Id &&
                    c.UserId == s.UserTwoId &&
                    c.CheckedInAt >= cycle.StartUtc &&
                    c.CheckedInAt < cycle.EndUtc
                );

                /*
                 * Existing streaks may have a legacy check-in timestamp but no
                 * StreakCheckIn row yet. Count that timestamp as one check-in only
                 * when the new history table has no record for that user this cycle.
                 */
                if (
                    userOneCycleCheckInCount == 0 &&
                    s.UserOneLastCheckedInAt.HasValue &&
                    s.UserOneLastCheckedInAt.Value >= cycle.StartUtc &&
                    s.UserOneLastCheckedInAt.Value < cycle.EndUtc
                )
                {
                    userOneCycleCheckInCount = 1;
                }

                if (
                    userTwoCycleCheckInCount == 0 &&
                    s.UserTwoLastCheckedInAt.HasValue &&
                    s.UserTwoLastCheckedInAt.Value >= cycle.StartUtc &&
                    s.UserTwoLastCheckedInAt.Value < cycle.EndUtc
                )
                {
                    userTwoCycleCheckInCount = 1;
                }

                var currentUserCycleCheckInCount = isUserOne
                    ? userOneCycleCheckInCount
                    : userTwoCycleCheckInCount;

                var partnerCycleCheckInCount = isUserOne
                    ? userTwoCycleCheckInCount
                    : userOneCycleCheckInCount;

                var currentUserCompletedCycle =
                    currentUserCycleCheckInCount >= requiredCheckIns;

                var partnerCompletedCycle =
                    partnerCycleCheckInCount >= requiredCheckIns;

                var bothCompletedCycle =
                    currentUserCompletedCycle &&
                    partnerCompletedCycle;

                var hoursUntilCycleEnds = Math.Max(
                    0,
                    (int)Math.Ceiling(
                        (cycle.EndUtc - nowUtc).TotalHours
                    )
                );

                string? brokenMessage = null;

                if (
                    !s.IsActive &&
                    s.FailedAt.HasValue &&
                    s.FailedAt.Value != defaultDate
)
                {
                    var failedCycle =
                        StreakCycleCalculator.GetCurrentCycle(
                            s.StartedAt,
                            s.FailedAt.Value.AddTicks(-1),
                            cycleLength,
                            cycleUnit,
                            pacificTimeZone
                        );

                    var userOneFailedCycleCount = checkIns.Count(c =>
                        c.StreakId == s.Id &&
                        c.UserId == s.UserOneId &&
                        c.CheckedInAt >= failedCycle.StartUtc &&
                        c.CheckedInAt < failedCycle.EndUtc
                    );

                    var userTwoFailedCycleCount = checkIns.Count(c =>
                        c.StreakId == s.Id &&
                        c.UserId == s.UserTwoId &&
                        c.CheckedInAt >= failedCycle.StartUtc &&
                        c.CheckedInAt < failedCycle.EndUtc
                    );

                    if (
                        userOneFailedCycleCount == 0 &&
                        s.UserOneLastCheckedInAt.HasValue &&
                        s.UserOneLastCheckedInAt.Value >=
                            failedCycle.StartUtc &&
                        s.UserOneLastCheckedInAt.Value <
                            failedCycle.EndUtc
                    )
                    {
                        userOneFailedCycleCount = 1;
                    }

                    if (
                        userTwoFailedCycleCount == 0 &&
                        s.UserTwoLastCheckedInAt.HasValue &&
                        s.UserTwoLastCheckedInAt.Value >=
                            failedCycle.StartUtc &&
                        s.UserTwoLastCheckedInAt.Value <
                            failedCycle.EndUtc
                    )
                    {
                        userTwoFailedCycleCount = 1;
                    }

                    var userOneCompletedFailedCycle =
                        userOneFailedCycleCount >= requiredCheckIns;

                    var userTwoCompletedFailedCycle =
                        userTwoFailedCycleCount >= requiredCheckIns;

                    var currentUserCompletedFailedCycle = isUserOne
                        ? userOneCompletedFailedCycle
                        : userTwoCompletedFailedCycle;

                    var partnerCompletedFailedCycle = isUserOne
                        ? userTwoCompletedFailedCycle
                        : userOneCompletedFailedCycle;

                    var partnerName = isUserOne
                        ? s.UserTwo.UserName
                        : s.UserOne.UserName;

                    if (
                        !currentUserCompletedFailedCycle &&
                        partnerCompletedFailedCycle
                    )
                    {
                        brokenMessage = "You killed him! :'C";
                    }
                    else if (
                        currentUserCompletedFailedCycle &&
                        !partnerCompletedFailedCycle
                    )
                    {
                        brokenMessage =
                            $"{partnerName} killed him! :'C";
                    }
                    else
                    {
                        brokenMessage =
                            "You both killed him! :'C";
                    }
                }

                var userCheckedInToday = isUserOne
                    ? s.UserOneLastCheckedInAt.HasValue && ToPacificDate(s.UserOneLastCheckedInAt.Value) == todayPacific
                    : s.UserTwoLastCheckedInAt.HasValue && ToPacificDate(s.UserTwoLastCheckedInAt.Value) == todayPacific;

                var partnerCheckedInToday = isUserOne
                    ? s.UserTwoLastCheckedInAt.HasValue && ToPacificDate(s.UserTwoLastCheckedInAt.Value) == todayPacific
                    : s.UserOneLastCheckedInAt.HasValue && ToPacificDate(s.UserOneLastCheckedInAt.Value) == todayPacific;

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
                    $"{currentUserCycleCheckInCount} of " +
                    $"{requiredCheckIns} check-ins this " +
                    $"{cycleUnitDisplay}";

                return new
                {
                    s.Id,
                    s.HabitName,
                    s.HabitIcon,
                    s.Color,
                    s.CurrentCount,
                    s.IsActive,
                    RequiredCheckIns = requiredCheckIns,
                    CycleLength = cycleLength,
                    CycleUnit = cycleUnit,
                    CycleStartedAt = cycle.StartUtc,
                    CycleEndsAt = cycle.EndUtc,
                    UserCycleCheckInCount =
                        currentUserCycleCheckInCount,
                    PartnerCycleCheckInCount =
                        partnerCycleCheckInCount,
                    UserCompletedCycle =
                        currentUserCompletedCycle,
                    PartnerCompletedCycle =
                        partnerCompletedCycle,
                    BothCompletedCycle =
                        bothCompletedCycle,
                    CanCheckInCurrentCycle =
                        s.IsActive &&
                        !currentUserCompletedCycle,
                    HoursUntilCycleEnds =
                        hoursUntilCycleEnds,
                    IsPublic = isUserOne
                        ? s.UserOneVisibilityPublic
                        : s.UserTwoVisibilityPublic,
                    PartnerName = isUserOne ? s.UserTwo.UserName : s.UserOne.UserName,
                    CycleProgressMessage = cycleProgressMessage,
                    s.LastCompletedAt,
                    s.LastFullyCompletedAt,
                    s.UserOneLastCheckedInAt,
                    s.UserTwoLastCheckedInAt,
                    UserCheckedInToday = userCheckedInToday,
                    BrokenMessage = brokenMessage,
                    PartnerCheckedInToday = partnerCheckedInToday,
                    BothCheckedInToday = userCheckedInToday && partnerCheckedInToday,
                    s.StartedAt,
                    CanCheckInToday = !userCheckedInToday,
                    HoursUntilMidnight = hoursUntilMidnight,
                    PartnerId = isUserOne ? s.UserTwoId : s.UserOneId,
                    TimeMessage = userCheckedInToday
                        ? $"Send another streak in {hoursUntilMidnight} hours"
                        : $"Send a streak within {hoursUntilMidnight} hours or the streak dies!"
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
            {
                return Unauthorized();
            }

            var streak = await _context.Streaks
                .Include(s => s.UserOne)
                .Include(s => s.UserTwo)
                .FirstOrDefaultAsync(s =>
                    s.Id == id &&
                    (
                        s.UserOneId == currentUserId ||
                        s.UserTwoId == currentUserId
                    ));

            if (streak == null)
            {
                return NotFound("Streak not found.");
            }

            if (!streak.IsActive)
            {
                return BadRequest(
                    "This streak is no longer active."
                );
            }

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

            var cycle = StreakCycleCalculator.GetCurrentCycle(
                streak.StartedAt,
                nowUtc,
                cycleLength,
                cycleUnit,
                timeZone
            );

            var isUserOne =
                streak.UserOneId == currentUserId;

            var currentUserCheckInCount =
                await _context.StreakCheckIns.CountAsync(c =>
                    c.StreakId == streak.Id &&
                    c.UserId == currentUserId &&
                    c.CheckedInAt >= cycle.StartUtc &&
                    c.CheckedInAt < cycle.EndUtc
                );

            /*
             * Existing streaks may contain a legacy last-check-in
             * timestamp without a corresponding StreakCheckIn row.
             * Count that timestamp once during the transition.
             */
            var currentUserLegacyCheckIn = isUserOne
                ? streak.UserOneLastCheckedInAt
                : streak.UserTwoLastCheckedInAt;

            if (
                currentUserCheckInCount == 0 &&
                currentUserLegacyCheckIn.HasValue &&
                currentUserLegacyCheckIn.Value >= cycle.StartUtc &&
                currentUserLegacyCheckIn.Value < cycle.EndUtc
            )
            {
                currentUserCheckInCount = 1;
            }

            if (currentUserCheckInCount >= requiredCheckIns)
            {
                return BadRequest(new
                {
                    message =
                        "You already completed all required check-ins for this cycle.",
                    currentCheckIns = currentUserCheckInCount,
                    requiredCheckIns,
                    cycleEndsAt = cycle.EndUtc
                });
            }

            var receiverId = isUserOne
                ? streak.UserTwoId
                : streak.UserOneId;

            var senderName = isUserOne
                ? streak.UserOne.UserName
                : streak.UserTwo.UserName;

            var partnerCheckInCount =
                await _context.StreakCheckIns.CountAsync(c =>
                    c.StreakId == streak.Id &&
                    c.UserId == receiverId &&
                    c.CheckedInAt >= cycle.StartUtc &&
                    c.CheckedInAt < cycle.EndUtc
                );

            var partnerLegacyCheckIn = isUserOne
                ? streak.UserTwoLastCheckedInAt
                : streak.UserOneLastCheckedInAt;

            if (
                partnerCheckInCount == 0 &&
                partnerLegacyCheckIn.HasValue &&
                partnerLegacyCheckIn.Value >= cycle.StartUtc &&
                partnerLegacyCheckIn.Value < cycle.EndUtc
            )
            {
                partnerCheckInCount = 1;
            }

            var partnerCompletedBeforeCheckIn =
                partnerCheckInCount >= requiredCheckIns;

            var alreadyFullyCompletedThisCycle =
                streak.LastFullyCompletedAt.HasValue &&
                streak.LastFullyCompletedAt.Value >= cycle.StartUtc &&
                streak.LastFullyCompletedAt.Value < cycle.EndUtc;

            _context.StreakCheckIns.Add(
                new StreakCheckIn
                {
                    StreakId = streak.Id,
                    UserId = currentUserId,
                    CheckedInAt = nowUtc
                }
            );

            currentUserCheckInCount++;

            /*
             * Continue updating the legacy timestamp fields.
             * The current frontend and several existing features
             * still rely on these values.
             */
            if (isUserOne)
            {
                streak.UserOneLastCheckedInAt = nowUtc;
            }
            else
            {
                streak.UserTwoLastCheckedInAt = nowUtc;
            }

            var currentUserCompletedCycle =
                currentUserCheckInCount >= requiredCheckIns;

            var partnerCompletedCycle =
                partnerCheckInCount >= requiredCheckIns;

            var bothCompletedCycle =
                currentUserCompletedCycle &&
                partnerCompletedCycle;

            if (
                bothCompletedCycle &&
                !alreadyFullyCompletedThisCycle
            )
            {
                streak.CurrentCount++;
                streak.LastFullyCompletedAt = nowUtc;
                streak.LastCompletedAt = nowUtc;
            }

            await _context.SaveChangesAsync();

            var recentContent = await _context.CheckInContents
                .Where(c =>
                    c.StreakId == streak.Id &&
                    c.SenderId == currentUserId &&
                    c.ReceiverId == receiverId &&
                    !c.IsViewed &&
                    c.CreatedAt >= nowUtc.AddMinutes(-5)
                )
                .ToListAsync();

            var sentMessage = recentContent.Any(c =>
                c.ContentType == "Message"
            );

            var sentPhoto = recentContent.Any(c =>
                c.ContentType == "Photo"
            );

            /*
             * For the current notification wording, treat the
             * receiver as already finished only when they have
             * completed their full cycle requirement.
             */
            await _pushNotificationService
                .NotifyPartnerCheckedInAsync(
                    receiverId,
                    senderName ?? "Your partner",
                    streak.HabitName,
                    streak.CurrentCount +
                        (bothCompletedCycle ? 0 : 1),
                    sentMessage,
                    sentPhoto,
                    partnerCompletedBeforeCheckIn
                );

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

                RequiredCheckIns = requiredCheckIns,
                CycleLength = cycleLength,
                CycleUnit = cycleUnit,

                CycleStartedAt = cycle.StartUtc,
                CycleEndsAt = cycle.EndUtc,

                UserCycleCheckInCount =
                    currentUserCheckInCount,

                PartnerCycleCheckInCount =
                    partnerCheckInCount,

                UserCompletedCycle =
                    currentUserCompletedCycle,

                PartnerCompletedCycle =
                    partnerCompletedCycle,

                BothCompletedCycle =
                    bothCompletedCycle,

                CanCheckInCurrentCycle =
                    currentUserCheckInCount <
                    requiredCheckIns,

                HoursUntilCycleEnds =
                    hoursUntilCycleEnds,

                streak.LastCompletedAt,
                streak.LastFullyCompletedAt,
                streak.UserOneLastCheckedInAt,
                streak.UserTwoLastCheckedInAt,

                /*
                 * Legacy response fields remain present until
                 * the frontend has transitioned to cycle fields.
                 */
                UserCheckedInToday = true,
                PartnerCheckedInToday =
                    partnerCheckInCount > 0,
                BothCheckedInToday =
                    currentUserCheckInCount > 0 &&
                    partnerCheckInCount > 0,
                CanCheckInToday =
                    currentUserCheckInCount <
                    requiredCheckIns,

                TimeMessage = currentUserCompletedCycle
                    ? $"Cycle complete. Next cycle begins in approximately {hoursUntilCycleEnds} hours."
                    : $"{currentUserCheckInCount} of {requiredCheckIns} check-ins complete this cycle."
            });
        }
    }
}