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

        // GET api/streaks
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var streaks = await _context.Streaks.ToListAsync();

            var nowUtc = DateTime.UtcNow;
            var todayUtc = nowUtc.Date;
            var defaultDate = new DateTime(1900, 1, 1);

            foreach (var streak in streaks)
            {
                if (!streak.IsActive)
                    continue;

                if (streak.LastCompletedAt is DateTime lastCompletedAt &&
                    lastCompletedAt != defaultDate &&
                    (todayUtc - lastCompletedAt.Date).TotalDays > 1)
                {
                    streak.IsActive = false;
                    streak.FailedAt = nowUtc;
                }
            }

            await _context.SaveChangesAsync();

            var result = streaks.Select(s => new
            {
                s.Id,
                s.UserOneId,
                s.UserTwoId,
                s.HabitName,
                s.CurrentCount,
                s.IsActive,
                Status = s.IsActive ? "Active" : "Expired",
                s.StartedAt,
                LastCompletedAt = s.LastCompletedAt == null ? new DateTime(1900, 1, 1) : s.LastCompletedAt,
                FailedAt = s.FailedAt == null ? new DateTime(1900, 1, 1) : s.FailedAt
            });

            return Ok(result);
        }

        // GET api/streaks/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var streak = await _context.Streaks.FirstOrDefaultAsync(s => s.Id == id);

            if (streak == null)
                return NotFound("Streak not found.");

            var nowUtc = DateTime.UtcNow;
            var todayUtc = nowUtc.Date;
            var defaultDate = new DateTime(1900, 1, 1);

            if (streak.IsActive &&
                streak.LastCompletedAt is DateTime lastCompletedAt &&
                lastCompletedAt != defaultDate &&
                (todayUtc - lastCompletedAt.Date).TotalDays > 1)
            {
                streak.IsActive = false;
                streak.FailedAt = nowUtc;
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                streak.Id,
                streak.UserOneId,
                streak.UserTwoId,
                streak.HabitName,
                streak.CurrentCount,
                streak.IsActive,
                Status = streak.IsActive ? "Active" : "Expired",
                streak.StartedAt,
                LastCompletedAt = streak.LastCompletedAt == null ? new DateTime(1900, 1, 1) : streak.LastCompletedAt,
                FailedAt = streak.FailedAt == null ? new DateTime(1900, 1, 1) : streak.FailedAt
            });
        }

        // POST api/streaks/{id}/complete
        // Either participant can call this once per UTC day to increment the count.
        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteStreak(int id, CompleteStreakDto dto)
        {
            var streak = await _context.Streaks
                .FirstOrDefaultAsync(s => s.Id == id);

            if (streak == null)
                return NotFound("Streak not found.");

            // A failed streak must be restarted via a new StreakRequest — it cannot
            // be resumed by logging a completion.
            if (!streak.IsActive)
                return BadRequest($"This streak failed on {streak.FailedAt:yyyy-MM-dd} and is no longer active.");

            // Verify the caller is a participant in this streak.
            if (streak.UserOneId != dto.UserId && streak.UserTwoId != dto.UserId)
                return Forbid();

            var nowUtc = DateTime.UtcNow;
            var todayUtc = nowUtc.Date;

            var defaultDate = new DateTime(1900, 1, 1);

            // Prevent more than one completion per UTC day.
            if (streak.LastCompletedAt is DateTime lastCompleted &&
                lastCompleted != defaultDate &&
                lastCompleted.Date == todayUtc)
            {
                return BadRequest("Streak already completed for today.");
            }

            // If more than one full day has passed since the last completion the
            // streak is broken. Mark it failed and return a 409 so the client can
            // prompt the user to start a fresh streak request.
            if (streak.LastCompletedAt is DateTime lastCompletedAt &&
                lastCompletedAt != defaultDate &&
                (todayUtc - lastCompletedAt.Date).TotalDays > 1)
            {
                streak.IsActive = false;
                streak.FailedAt = nowUtc;

                await _context.SaveChangesAsync();

                return Conflict(new
                {
                    message = "Streak broken — a day was missed. Start a new streak request to try again.",
                    streak.Id,
                    streak.HabitName,
                    finalCount = streak.CurrentCount,
                    streak.FailedAt
                });
            }

            streak.CurrentCount++;
            streak.LastCompletedAt = nowUtc;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Streak completed for today!",
                streak.Id,
                streak.HabitName,
                streak.CurrentCount,
                streak.LastCompletedAt
            });
        }
    }
}