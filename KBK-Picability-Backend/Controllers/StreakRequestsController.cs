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

            // Verify friendship exists in the database
            bool areFriends = await _context.Friends.AnyAsync(f =>
                (f.UserId == currentUserId && f.FriendId == dto.ReceiverId) ||
                (f.UserId == dto.ReceiverId && f.FriendId == currentUserId));

            if (!areFriends)
                return BadRequest("Users must be friends before starting a streak.");

            bool duplicatePending = await _context.StreakRequests.AnyAsync(sr =>
                sr.SenderId == currentUserId &&
                sr.ReceiverId == dto.ReceiverId &&
                sr.HabitName == dto.HabitName &&
                sr.Status == "Pending");

            if (duplicatePending)
                return BadRequest("A pending streak request already exists.");

            // Added check to prevent multiple active streaks for the same habit between the same users
            bool duplicateActive = await _context.Streaks.AnyAsync(s =>
                ((s.UserOneId == currentUserId && s.UserTwoId == dto.ReceiverId) ||
                (s.UserOneId == dto.ReceiverId && s.UserTwoId == currentUserId)) &&
                s.HabitName == dto.HabitName &&
                s.IsActive);

            if (duplicateActive)
                return BadRequest("You already have an active streak for this habit with this friend.");

            var request = new StreakRequest
            {
                SenderId = currentUserId,
                ReceiverId = dto.ReceiverId,
                HabitName = dto.HabitName,
                HabitIcon = dto.HabitIcon,
                Color = dto.Color,
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
                dto.HabitName
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

            var streak = new Streak
            {
                UserOneId = request.SenderId,
                UserTwoId = request.ReceiverId,
                HabitName = request.HabitName,
                HabitIcon = request.HabitIcon,
                Color = request.Color,
                CurrentCount = 0,
                IsActive = true,
                StreakRequestId = request.Id,
                StartedAt = nowUtc,
                LastCompletedAt = defaultDate, // Set default to avoid NULL
                FailedAt = defaultDate,        // Set default to satisfy NOT NULL constraint
                IntervalHours = 24             // Default value
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