using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.DTOs;
using Picability.Models;

namespace Picability.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CheckInContentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CheckInContentController(ApplicationDbContext context)
        {
            _context = context;
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

            var streak = await _context.Streaks
                .FirstOrDefaultAsync(s => s.Id == model.StreakId && s.IsActive);

            if (streak == null)
            {
                return NotFound(new { message = "Active streak not found." });
            }

            if (model.SenderId != streak.UserOneId && model.SenderId != streak.UserTwoId)
            {
                return BadRequest(new { message = "Sender is not part of this streak." });
            }

            var receiverId = model.SenderId == streak.UserOneId
                ? streak.UserTwoId
                : streak.UserOneId;

            var content = new CheckInContent
            {
                StreakId = streak.Id,
                SenderId = model.SenderId,
                ReceiverId = receiverId,
                ContentType = "Message",
                MessageText = model.MessageText.Trim(),
                ViewDurationSeconds = model.ViewDurationSeconds,
                CreatedAt = DateTime.UtcNow,
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
                content.CreatedAt
            });
        }

        [HttpGet("unread/{userId}")]
        public async Task<IActionResult> GetUnreadForUser(string userId)
        {
            var contents = await _context.CheckInContents
                .Include(c => c.Streak)
                .Include(c => c.Sender)
                .Where(c =>
                    c.ReceiverId == userId &&
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
            var content = await _context.CheckInContents
                .FirstOrDefaultAsync(c => c.Id == id);

            if (content == null)
            {
                return NotFound();
            }

            content.IsViewed = true;
            content.ViewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                content.Id,
                content.ViewedAt,
                content.ViewDurationSeconds
            });
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

            if (model.PhotoDataUrl.Length > 1_500_000)
            {
                return BadRequest(new { message = "Photo is too large. Please choose a smaller image." });
            }

            if (model.ViewDurationSeconds < 1 || model.ViewDurationSeconds > 10)
            {
                return BadRequest(new { message = "View duration must be between 1 and 10 seconds." });
            }

            var streak = await _context.Streaks
                .FirstOrDefaultAsync(s => s.Id == model.StreakId && s.IsActive);

            if (streak == null)
            {
                return NotFound(new { message = "Active streak not found." });
            }

            if (model.SenderId != streak.UserOneId && model.SenderId != streak.UserTwoId)
            {
                return BadRequest(new { message = "Sender is not part of this streak." });
            }

            var receiverId = model.SenderId == streak.UserOneId
                ? streak.UserTwoId
                : streak.UserOneId;

            var content = new CheckInContent
            {
                StreakId = streak.Id,
                SenderId = model.SenderId,
                ReceiverId = receiverId,
                ContentType = "Photo",
                PhotoUrl = model.PhotoDataUrl,
                ViewDurationSeconds = model.ViewDurationSeconds,
                CreatedAt = DateTime.UtcNow,
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
                content.CreatedAt
            });
        }
    }
}