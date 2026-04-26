using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.DTOs;
using Picability.Models;

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

        [HttpPost]
        public async Task<IActionResult> SendStreakRequest(CreateStreakRequestDto dto)
        {
            if (dto.SenderId == dto.ReceiverId)
                return BadRequest("You cannot send a streak request to yourself.");

            bool areFriends = await _context.Friends.AnyAsync(f =>
                f.UserId == dto.SenderId && f.FriendId == dto.ReceiverId);

            if (!areFriends)
                return BadRequest("Users must be friends before starting a streak.");

            bool duplicatePending = await _context.StreakRequests.AnyAsync(sr =>
                sr.SenderId == dto.SenderId &&
                sr.ReceiverId == dto.ReceiverId &&
                sr.HabitName == dto.HabitName &&
                sr.Status == "Pending");

            if (duplicatePending)
                return BadRequest("A pending streak request already exists.");

            var request = new StreakRequest
            {
                SenderId = dto.SenderId,
                ReceiverId = dto.ReceiverId,
                HabitName = dto.HabitName,
                Status = "Pending"
            };

            _context.StreakRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(request);
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

        [HttpPost("accept/{requestId}")]
        public async Task<IActionResult> AcceptStreakRequest(int requestId)
        {
            var request = await _context.StreakRequests
                .FirstOrDefaultAsync(sr => sr.Id == requestId);

            if (request == null)
                return NotFound("Streak request not found.");

            if (request.Status != "Pending")
                return BadRequest("Request already handled.");

            var streak = new Streak
            {
                UserOneId = request.SenderId,
                UserTwoId = request.ReceiverId,
                HabitName = request.HabitName,
                CurrentCount = 0,
                IsActive = true,
                StreakRequestId = request.Id,
                StartedAt = DateTime.UtcNow
            };

            _context.Streaks.Add(streak);
            request.Status = "Accepted";

            await _context.SaveChangesAsync();

            return Ok(streak);
        }

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