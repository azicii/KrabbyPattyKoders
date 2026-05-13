using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.DTOs;
using Picability.Models;

namespace Picability.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StreaksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StreaksController(ApplicationDbContext context)
        {
            _context = context;
        }

        // MODIFIED BY REECE
        // Before: Fetched streaks, dead streaks remained in the database as active
        // After: When fetching streaks, we check if any should be marked as failed based 
        // on the last completed date using a foreach loop. This way, dead streaks are automatically marked as 
        // inactive without needing a separate cleanup process.
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserStreaks(string userId)
        {
            var streaks = await _context.Streaks
                .Include(s => s.UserOne)
                .Include(s => s.UserTwo)
                .Where(s => (s.UserOneId == userId || s.UserTwoId == userId) && s.IsActive)
                .ToListAsync();

            var nowUtc = DateTime.UtcNow;
            var todayUtc = nowUtc.Date;
            var defaultDate = new DateTime(1900, 1, 1);
            bool changesMade = false;

            foreach (var streak in streaks)
            {
                if (streak.LastCompletedAt is DateTime lastCompletedAt &&
                    lastCompletedAt != defaultDate &&
                    (todayUtc - lastCompletedAt.Date).TotalDays > 1)
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

            var result = streaks.Select(s => new
            {
                s.Id,
                s.HabitName,
                s.HabitIcon,
                s.Color,
                s.CurrentCount,
                s.IsActive,
                PartnerName = s.UserOneId == userId ? s.UserTwo.UserName : s.UserOne.UserName,
                s.LastCompletedAt,
                s.StartedAt
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
            var streak = await _context.Streaks.FirstOrDefaultAsync(s => s.Id == id);
            if (streak == null) return NotFound("Streak not found.");

            _context.Streaks.Remove(streak);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Streak dismissed and removed from database." });
        }

        // ADDED BY REECE
        // Before: Removing a friend did not affect streaks. They would
        // remain in the database and UI.
        // After: Removing a friend also removes any streaks between the
        // users, also cleaning the UI.
        [HttpDelete("remove-connection/{userId}/{friendId}")]
        public async Task<IActionResult> RemoveFriendStreaks(string userId, string friendId)
        {
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
            var streak = await _context.Streaks
                .Include(s => s.UserOne)
                .Include(s => s.UserTwo)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (streak == null) return NotFound("Streak not found.");
            return Ok(streak);
        }

        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteStreak(int id, CompleteStreakDto dto)
        {
            var streak = await _context.Streaks.FirstOrDefaultAsync(s => s.Id == id);
            if (streak == null) return NotFound("Streak not found.");
            if (!streak.IsActive) return BadRequest("This streak is no longer active.");
            if (streak.UserOneId != dto.UserId && streak.UserTwoId != dto.UserId) return Forbid();

            var nowUtc = DateTime.UtcNow;
            var todayUtc = nowUtc.Date;
            var defaultDate = new DateTime(1900, 1, 1);

            if (streak.LastCompletedAt is DateTime lastCompleted &&
                lastCompleted != defaultDate &&
                lastCompleted.Date == todayUtc)
            {
                return BadRequest("Already checked in for today!");
            }

            if (streak.LastCompletedAt is DateTime lastDate &&
                lastDate != defaultDate &&
                (todayUtc - lastDate.Date).TotalDays > 1)
            {
                streak.IsActive = false;
                streak.FailedAt = nowUtc;
                await _context.SaveChangesAsync();
                return Conflict(new { message = "Streak broken!" });
            }

            streak.CurrentCount++;
            streak.LastCompletedAt = nowUtc;
            await _context.SaveChangesAsync();

            return Ok(new { streak.Id, streak.CurrentCount, streak.LastCompletedAt });
        }
    }
}