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
    public class CheckInContentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

         /*
         * Base64 is roughly 33% larger than the original image.
         * 12 million characters allows approximately 9 MB of image data.
         */
        private const int MaxPhotoDataUrlLength = 12_000_000;
        private const int StaleContentRetentionDays = 365;

        public CheckInContentController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        private static TimeZoneInfo GetPacificTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(
                    "Pacific Standard Time"
                );
            }
            catch
            {
                return TimeZoneInfo.FindSystemTimeZoneById(
                    "America/Los_Angeles"
                );
            }
        }

        private async Task<(int CheckInNumber, int RequiredCheckIns)>
    GetNextCheckInPositionAsync(
        Streak streak,
        string currentUserId,
        DateTime nowUtc)
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

            var cycle = StreakCycleCalculator.GetCurrentCycle(
                streak.StartedAt,
                nowUtc,
                cycleLength,
                cycleUnit,
                GetPacificTimeZone()
            );

            var existingCheckInCount =
                await _context.StreakCheckIns.CountAsync(c =>
                    c.StreakId == streak.Id &&
                    c.UserId == currentUserId &&
                    c.CheckedInAt >= cycle.StartUtc &&
                    c.CheckedInAt < cycle.EndUtc
                );

            var isUserOne =
                streak.UserOneId == currentUserId;

            var legacyCheckIn = isUserOne
                ? streak.UserOneLastCheckedInAt
                : streak.UserTwoLastCheckedInAt;

            if (
                existingCheckInCount == 0 &&
                legacyCheckIn.HasValue &&
                legacyCheckIn.Value >= cycle.StartUtc &&
                legacyCheckIn.Value < cycle.EndUtc
            )
            {
                existingCheckInCount = 1;
            }

            var nextCheckInNumber = Math.Min(
                requiredCheckIns,
                existingCheckInCount + 1
            );

            return (
                nextCheckInNumber,
                requiredCheckIns
            );
        }

        private async Task DeleteStaleCheckInContentAsync()
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-StaleContentRetentionDays);

            var staleContents = await _context.CheckInContents
                .Where(c => !c.IsViewed && c.CreatedAt < cutoffDate)
                .ToListAsync();

            if (staleContents.Count == 0)
                return;

            _context.CheckInContents.RemoveRange(staleContents);
            await _context.SaveChangesAsync();
        }

        [HttpPost("message")]
        public async Task<IActionResult> CreateMessage([FromBody] CreateCheckInMessageDto model)
        {
            if (string.IsNullOrWhiteSpace(model.MessageText))
            {
                return BadRequest(new { message = "Message cannot be empty." });
            }

            if (model.ViewDurationSeconds < 1 || model.ViewDurationSeconds > 10)
            {
                return BadRequest(new { message = "View duration must be between 1 and 10 seconds." });
            }

            await DeleteStaleCheckInContentAsync();

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var streak = await _context.Streaks
                .FirstOrDefaultAsync(s => s.Id == model.StreakId && s.IsActive);

            if (streak == null)
            {
                return NotFound(new { message = "Active streak not found." });
            }

            if (currentUserId != streak.UserOneId && currentUserId != streak.UserTwoId)
            {
                return Forbid();
            }

            var receiverId = currentUserId == streak.UserOneId
                ? streak.UserTwoId
                : streak.UserOneId;

            var nowUtc = DateTime.UtcNow;

            var checkInPosition =
                await GetNextCheckInPositionAsync(
                    streak,
                    currentUserId,
                    nowUtc
                );

            var content = new CheckInContent
            {
                StreakId = streak.Id,
                SenderId = currentUserId,
                ReceiverId = receiverId,

                ContentType = "Message",

                CheckInNumber =
                    checkInPosition.CheckInNumber,

                RequiredCheckIns =
                    checkInPosition.RequiredCheckIns,

                MessageText = model.MessageText.Trim(),
                ViewDurationSeconds = model.ViewDurationSeconds,
                CreatedAt = nowUtc,
                IsViewed = false
            };

            _context.CheckInContents.Add(content);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Check-in message created.",
                content.Id,
                content.StreakId,
                content.SenderId,
                content.ReceiverId,
                content.ContentType,
                content.MessageText,
                content.ViewDurationSeconds,
                content.CreatedAt,
                content.CheckInNumber,
                content.RequiredCheckIns
            });
        }

        [HttpGet("unread")]
        public async Task<IActionResult> GetUnreadForCurrentUser()
        {
            await DeleteStaleCheckInContentAsync();

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var contents = await _context.CheckInContents
                .Include(c => c.Streak)
                .Include(c => c.Sender)
                .Where(c =>
                    c.ReceiverId == currentUserId &&
                    !c.IsViewed &&
                    c.Streak.IsActive)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.StreakId,
                    c.SenderId,
                    SenderName = c.Sender.UserName,
                    c.ReceiverId,
                    c.ContentType,
                    c.CheckInNumber,
                    c.RequiredCheckIns,
                    c.MessageText,
                    c.PhotoUrl,
                    c.ViewDurationSeconds,
                    c.CreatedAt
                })
                .ToListAsync();

            return Ok(contents);
        }

        [HttpPost("{id}/view")]
        public async Task<IActionResult> MarkViewed(int id)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var content = await _context.CheckInContents
                .FirstOrDefaultAsync(c => c.Id == id);

            if (content == null)
            {
                return NotFound();
            }

            if (content.ReceiverId != currentUserId)
            {
                return Forbid();
            }

            var response = new
            {
                content.Id,
                ViewedAt = DateTime.UtcNow,
                content.ViewDurationSeconds
            };

            _context.CheckInContents.Remove(content);
            await _context.SaveChangesAsync();

            return Ok(response);
        }

        [HttpPost("photo")]
        public async Task<IActionResult> CreatePhoto([FromBody] CreateCheckInPhotoDto model)
        {
            if (string.IsNullOrWhiteSpace(model.PhotoDataUrl))
            {
                return BadRequest(new { message = "Photo is required." });
            }

            if (!model.PhotoDataUrl.StartsWith("data:image/png;base64,") &&
                !model.PhotoDataUrl.StartsWith("data:image/jpeg;base64,"))
            {
                return BadRequest(new { message = "Only PNG and JPG images are allowed." });
            }

            if (model.PhotoDataUrl.Length > MaxPhotoDataUrlLength)
            {
                return BadRequest(new { message = "Photo is too large. Please choose a smaller image." });
            }

            if (model.ViewDurationSeconds < 1 || model.ViewDurationSeconds > 10)
            {
                return BadRequest(new { message = "View duration must be between 1 and 10 seconds." });
            }

            await DeleteStaleCheckInContentAsync();

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var streak = await _context.Streaks
                .FirstOrDefaultAsync(s => s.Id == model.StreakId && s.IsActive);

            if (streak == null)
            {
                return NotFound(new { message = "Active streak not found." });
            }

            if (currentUserId != streak.UserOneId && currentUserId != streak.UserTwoId)
            {
                return Forbid();
            }

            var receiverId = currentUserId == streak.UserOneId
                ? streak.UserTwoId
                : streak.UserOneId;

            var nowUtc = DateTime.UtcNow;

            var checkInPosition =
                await GetNextCheckInPositionAsync(
                    streak,
                    currentUserId,
                    nowUtc
                );

            var content = new CheckInContent
            {
                StreakId = streak.Id,
                SenderId = currentUserId,
                ReceiverId = receiverId,

                ContentType = "Photo",

                CheckInNumber =
        checkInPosition.CheckInNumber,

                RequiredCheckIns =
        checkInPosition.RequiredCheckIns,

                PhotoUrl = model.PhotoDataUrl,
                ViewDurationSeconds = model.ViewDurationSeconds,
                CreatedAt = nowUtc,
                IsViewed = false
            };

            _context.CheckInContents.Add(content);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Check-in photo created.",
                content.Id,
                content.StreakId,
                content.SenderId,
                content.ReceiverId,
                content.ContentType,
                content.PhotoUrl,
                content.ViewDurationSeconds,
                content.CreatedAt,
                content.CheckInNumber,
                content.RequiredCheckIns
            });
        }
    }
}