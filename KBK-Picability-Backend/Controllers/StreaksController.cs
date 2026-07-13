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
            var defaultDate = new DateTime(1900, 1, 1);
            bool changesMade = false;

            foreach (var streak in streaks)
            {
                var lastFullyCompleted = streak.LastFullyCompletedAt ?? streak.LastCompletedAt;

                DateTime anchorDateUtc;

                if (lastFullyCompleted is DateTime completedAt && completedAt != defaultDate)
                {
                    anchorDateUtc = completedAt;
                }
                else
                {
                    anchorDateUtc = streak.StartedAt;
                }

                var anchorPacificDate = ToPacificDate(anchorDateUtc);

                var missedYesterdayOrEarlier = anchorPacificDate < todayPacific.AddDays(-1);

                var startedBeforeTodayAndNeverCompleted =
                    (lastFullyCompleted == null || lastFullyCompleted == defaultDate) &&
                    anchorPacificDate < todayPacific.AddDays(-1);

                if (missedYesterdayOrEarlier || startedBeforeTodayAndNeverCompleted)
                {
                    streak.IsActive = false;
                    streak.FailedAt = nowUtc;
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
                var cycle = StreakCycleCalculator.GetCurrentCycle(
                    s.StartedAt,
                    nowUtc,
                    s.CycleLength,
                    s.CycleUnit,
                    GetPacificTimeZone()
                );

                var requiredCheckIns = Math.Max(
                    1,
                    s.RequiredCheckIns
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

                if (!s.IsActive && s.FailedAt.HasValue)
                {
                    var failedPacificDate = ToPacificDate(s.FailedAt.Value);
                    var missedPacificDate = failedPacificDate.AddDays(-1);

                    var userOneCheckedMissedDay =
                        s.UserOneLastCheckedInAt.HasValue &&
                        ToPacificDate(s.UserOneLastCheckedInAt.Value) == missedPacificDate;

                    var userTwoCheckedMissedDay =
                        s.UserTwoLastCheckedInAt.HasValue &&
                        ToPacificDate(s.UserTwoLastCheckedInAt.Value) == missedPacificDate;

                    var currentUserCheckedMissedDay = isUserOne
                        ? userOneCheckedMissedDay
                        : userTwoCheckedMissedDay;

                    var partnerCheckedMissedDay = isUserOne
                        ? userTwoCheckedMissedDay
                        : userOneCheckedMissedDay;

                    var partnerName = isUserOne ? s.UserTwo.UserName : s.UserOne.UserName;

                    if (!currentUserCheckedMissedDay && partnerCheckedMissedDay)
                    {
                        brokenMessage = "You killed him! :'C";
                    }
                    else if (currentUserCheckedMissedDay && !partnerCheckedMissedDay)
                    {
                        brokenMessage = $"{partnerName} killed him! :'C";
                    }
                    else
                    {
                        brokenMessage = "You both killed him! :'C";
                    }
                }

                var userCheckedInToday = isUserOne
                    ? s.UserOneLastCheckedInAt.HasValue && ToPacificDate(s.UserOneLastCheckedInAt.Value) == todayPacific
                    : s.UserTwoLastCheckedInAt.HasValue && ToPacificDate(s.UserTwoLastCheckedInAt.Value) == todayPacific;

                var partnerCheckedInToday = isUserOne
                    ? s.UserTwoLastCheckedInAt.HasValue && ToPacificDate(s.UserTwoLastCheckedInAt.Value) == todayPacific
                    : s.UserOneLastCheckedInAt.HasValue && ToPacificDate(s.UserOneLastCheckedInAt.Value) == todayPacific;

                var cycleUnitDisplay = s.CycleUnit switch
                {
                    "Week" => s.CycleLength == 1
                        ? "week"
                        : $"{s.CycleLength} weeks",

                    "Month" => s.CycleLength == 1
                        ? "month"
                        : $"{s.CycleLength} months",

                    _ => s.CycleLength == 1
                        ? "day"
                        : $"{s.CycleLength} days"
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
                    s.RequiredCheckIns,
                    s.CycleLength,
                    s.CycleUnit,
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

        [HttpPost("{id}/remind")]
        public async Task<IActionResult> SendStreakReminder(int id)
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
                    s.IsActive &&
                    (s.UserOneId == currentUserId ||
                     s.UserTwoId == currentUserId));

            if (streak == null)
            {
                return NotFound(new
                {
                    message = "Active streak not found."
                });
            }

            var nowUtc = DateTime.UtcNow;
            var todayPacific = GetPacificToday(nowUtc);
            var isUserOne = streak.UserOneId == currentUserId;

            var currentUserCheckedInToday = isUserOne
                ? streak.UserOneLastCheckedInAt.HasValue &&
                  ToPacificDate(streak.UserOneLastCheckedInAt.Value) == todayPacific
                : streak.UserTwoLastCheckedInAt.HasValue &&
                  ToPacificDate(streak.UserTwoLastCheckedInAt.Value) == todayPacific;

            var partnerCheckedInToday = isUserOne
                ? streak.UserTwoLastCheckedInAt.HasValue &&
                  ToPacificDate(streak.UserTwoLastCheckedInAt.Value) == todayPacific
                : streak.UserOneLastCheckedInAt.HasValue &&
                  ToPacificDate(streak.UserOneLastCheckedInAt.Value) == todayPacific;

            if (!currentUserCheckedInToday)
            {
                return BadRequest(new
                {
                    message = "You must complete your check-in before sending a reminder."
                });
            }

            if (partnerCheckedInToday)
            {
                return BadRequest(new
                {
                    message = "Your partner already checked in today."
                });
            }

            var receiverId = isUserOne
                ? streak.UserTwoId
                : streak.UserOneId;

            var senderName = isUserOne
                ? streak.UserOne.UserName
                : streak.UserTwo.UserName;

            var result = await _pushNotificationService.NotifyStreakReminderAsync(
                receiverId,
                senderName ?? "Your partner",
                streak.HabitName
            );

            return Ok(new
            {
                message = "Reminder sent.",
                pushResult = result
            });
        }

        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteStreak(int id, CompleteStreakDto dto)
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

            if (streak == null)
            {
                return NotFound("Streak not found.");
            }

            if (!streak.IsActive)
            {
                return BadRequest("This streak is no longer active.");
            }

            var nowUtc = DateTime.UtcNow;
            var todayPacific = GetPacificToday(nowUtc);
            var hoursUntilMidnight = GetHoursUntilPacificMidnight(nowUtc);
            var defaultDate = new DateTime(1900, 1, 1);

            var lastFullyCompleted = streak.LastFullyCompletedAt ?? streak.LastCompletedAt;

            DateTime anchorDateUtc;

            if (lastFullyCompleted is DateTime completedAt && completedAt != defaultDate)
            {
                anchorDateUtc = completedAt;
            }
            else
            {
                anchorDateUtc = streak.StartedAt;
            }

            var anchorPacificDate = ToPacificDate(anchorDateUtc);

            var missedYesterdayOrEarlier = anchorPacificDate < todayPacific.AddDays(-1);

            var startedBeforeTodayAndNeverCompleted =
                (lastFullyCompleted == null || lastFullyCompleted == defaultDate) &&
                anchorPacificDate < todayPacific.AddDays(-1);

            if (missedYesterdayOrEarlier || startedBeforeTodayAndNeverCompleted)
            {
                streak.IsActive = false;
                streak.FailedAt = nowUtc;
                await _context.SaveChangesAsync();
                return Conflict(new { message = "Streak broken!" });
            }

            var isUserOne = streak.UserOneId == currentUserId;

            var userLastCheckIn = isUserOne
                ? streak.UserOneLastCheckedInAt
                : streak.UserTwoLastCheckedInAt;

            if (userLastCheckIn is DateTime existingCheckIn &&
                ToPacificDate(existingCheckIn) == todayPacific)
            {
                return BadRequest("You already checked in today!");
            }

            if (isUserOne)
            {
                streak.UserOneLastCheckedInAt = nowUtc;
            }
            else
            {
                streak.UserTwoLastCheckedInAt = nowUtc;
            }

            var userOneCheckedInToday =
                streak.UserOneLastCheckedInAt.HasValue &&
                ToPacificDate(streak.UserOneLastCheckedInAt.Value) == todayPacific;
            var userTwoCheckedInToday =
                streak.UserTwoLastCheckedInAt.HasValue &&
                ToPacificDate(streak.UserTwoLastCheckedInAt.Value) == todayPacific;

            var alreadyFullyCompletedToday =
                lastFullyCompleted.HasValue &&
                ToPacificDate(lastFullyCompleted.Value) == todayPacific;

            var bothCheckedInToday = userOneCheckedInToday && userTwoCheckedInToday;

            var shouldNotifyPartner = true;

            var receiverId = isUserOne ? streak.UserTwoId : streak.UserOneId;
            var partnerName = isUserOne ? streak.UserOne.UserName : streak.UserTwo.UserName;
            var notificationStreakDay = streak.CurrentCount + 1;

            var receiverAlreadyCheckedInToday = isUserOne
                ? userTwoCheckedInToday
                : userOneCheckedInToday;

            if (bothCheckedInToday && !alreadyFullyCompletedToday)
            {
                streak.CurrentCount++;
                streak.LastFullyCompletedAt = nowUtc;
                streak.LastCompletedAt = nowUtc;
            }

            await _context.SaveChangesAsync();

            if (shouldNotifyPartner)
            {
                var recentContent = await _context.CheckInContents
                    .Where(c =>
                        c.StreakId == streak.Id &&
                        c.SenderId == currentUserId &&
                        c.ReceiverId == receiverId &&
                        !c.IsViewed &&
                        c.CreatedAt >= nowUtc.AddMinutes(-5))
                    .ToListAsync();

                var sentMessage = recentContent.Any(c => c.ContentType == "Message");
                var sentPhoto = recentContent.Any(c => c.ContentType == "Photo");

                await _pushNotificationService.NotifyPartnerCheckedInAsync(
                    receiverId,
                    partnerName ?? "Your partner",
                    streak.HabitName,
                    notificationStreakDay,
                    sentMessage,
                    sentPhoto,
                    receiverAlreadyCheckedInToday
                );
            }

            return Ok(new
            {
                streak.Id,
                streak.CurrentCount,
                streak.LastCompletedAt,
                streak.LastFullyCompletedAt,
                streak.UserOneLastCheckedInAt,
                streak.UserTwoLastCheckedInAt,
                UserCheckedInToday = true,
                PartnerCheckedInToday = isUserOne ? userTwoCheckedInToday : userOneCheckedInToday,
                BothCheckedInToday = bothCheckedInToday,
                CanCheckInToday = false,
                HoursUntilMidnight = hoursUntilMidnight,
                TimeMessage = bothCheckedInToday
                    ? $"Send another streak in {hoursUntilMidnight} hours"
                    : $"Send a streak within {hoursUntilMidnight} hours or the streak dies!"
            });
        }
    }
}