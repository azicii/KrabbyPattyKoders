using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.DTOs;
using Picability.Models;
using Microsoft.AspNetCore.Cors;

namespace Picability.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StreakRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StreakRequestsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // MODIFIED BY REECE
        // Before: Experienced UI issues when creating the element that allows
        // streaks to be created from the user search screen. Resulted from
        // non-friend users' streak requests creating NULL values.
        // After: Verifies users are friends before streak requests can be sent
        // not really used anymore after fixing the bug, but it's a good safeguard
        // just in case.
        // POST api/streakrequests
        [HttpPost]
        public async Task<IActionResult> SendStreakRequest(CreateStreakRequestDto dto)
        {
            if (dto.SenderId == dto.ReceiverId)
                return BadRequest("You cannot send a streak request to yourself.");

            // Verify friendship exists in the database
            bool areFriends = await _context.Friends.AnyAsync(f =>
                (f.UserId == dto.SenderId && f.FriendId == dto.ReceiverId) ||
                (f.UserId == dto.ReceiverId && f.FriendId == dto.SenderId));

            if (!areFriends)
                return BadRequest("Users must be friends before starting a streak.");

            bool duplicatePending = await _context.StreakRequests.AnyAsync(sr =>
                sr.SenderId == dto.SenderId &&
                sr.ReceiverId == dto.ReceiverId &&
                sr.HabitName == dto.HabitName &&
                sr.Status == "Pending");

            if (duplicatePending)
                return BadRequest("A pending streak request already exists.");

            // Added check to prevent multiple active streaks for the same habit between the same users
            bool duplicateActive = await _context.Streaks.AnyAsync(s =>
                ((s.UserOneId == dto.SenderId && s.UserTwoId == dto.ReceiverId) ||
                (s.UserOneId == dto.ReceiverId && s.UserTwoId == dto.SenderId)) &&
                s.HabitName == dto.HabitName &&
                s.IsActive);

            if (duplicateActive)
                return BadRequest("You already have an active streak for this habit with this friend.");

            var request = new StreakRequest
            {
                SenderId = dto.SenderId,
                ReceiverId = dto.ReceiverId,
                HabitName = dto.HabitName,
                HabitIcon = dto.HabitIcon,
                Color = dto.Color,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.StreakRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(request);
        }

        // ADDED BY REECE
        // Before: No endpoint for the UI to fetch incoming streak requests for a user
        // After: Added this endpoint to fetch incoming streak requests for a user, 
        // including sender info
        [HttpGet("receiver/{receiverId}")]
        public async Task<IActionResult> GetIncomingRequests(string receiverId)
        {
            var requests = await _context.StreakRequests
                .Include(sr => sr.Sender)
                .Where(r => r.ReceiverId == receiverId && r.Status == "Pending")
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

        [HttpGet("sender/{senderId}")]
        public async Task<IActionResult> GetOutgoingRequests(string senderId)
        {
            var requests = await _context.StreakRequests
                .Include(sr => sr.Receiver)
                .Where(r => r.SenderId == senderId && r.Status == "Pending")
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

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var requests = await _context.StreakRequests
                .Select(sr => new
                {
                    sr.Id,
                    sr.SenderId,
                    sr.ReceiverId,
                    sr.HabitName,
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
            var request = await _context.StreakRequests
                .FirstOrDefaultAsync(sr => sr.Id == requestId);

            if (request == null)
                return NotFound("Streak request not found.");

            if (request.Status != "Pending")
                return BadRequest("Request already handled.");

            var nowUtc = DateTime.UtcNow;
            var defaultDate = new DateTime(1900, 1, 1);

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
            var request = await _context.StreakRequests
                .FirstOrDefaultAsync(sr => sr.Id == requestId);

            if (request == null)
                return NotFound("Streak request not found.");

            if (request.Status != "Pending")
                return BadRequest("Request already handled.");

            request.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Streak request rejected", requestId = request.Id });
        }
    }
}