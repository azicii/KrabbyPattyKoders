using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.DTOs;
using Picability.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Picability.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StreaksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StreaksController(ApplicationDbContext context)
        {
            _context = context;
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
                    anchorPacificDate < todayPacific;

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

                return new
                {
                    s.Id,
                    s.HabitName,
                    s.HabitIcon,
                    s.Color,
                    s.CurrentCount,
                    s.IsActive,
                    IsPublic = isUserOne
                        ? s.UserOneVisibilityPublic
                        : s.UserTwoVisibilityPublic,
                    PartnerName = isUserOne ? s.UserTwo.UserName : s.UserOne.UserName,
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

        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteStreak(int id, CompleteStreakDto dto)
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
                anchorPacificDate < todayPacific;

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

            if (bothCheckedInToday && !alreadyFullyCompletedToday)
            {
                streak.CurrentCount++;
                streak.LastFullyCompletedAt = nowUtc;
                streak.LastCompletedAt = nowUtc;
            }

            await _context.SaveChangesAsync();

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