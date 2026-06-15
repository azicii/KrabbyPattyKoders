using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.Models;
using Picability.DTOs;
using System.Security.Claims;

namespace Picability.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FriendRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FriendRequestsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        [HttpPost]
        public async Task<IActionResult> SendFriendRequest(CreateFriendRequestDto dto)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            if (currentUserId == dto.ReceiverId)
                return BadRequest("You cannot send a friend request to yourself.");

            bool duplicatePending = await _context.FriendRequests.AnyAsync(fr =>
                fr.SenderId == currentUserId &&
                fr.ReceiverId == dto.ReceiverId &&
                fr.Status == "Pending");

            if (duplicatePending)
                return BadRequest("A pending friend request already exists.");

            bool alreadyFriends = await _context.Friends.AnyAsync(f =>
                f.UserId == currentUserId &&
                f.FriendId == dto.ReceiverId);

            if (alreadyFriends)
                return BadRequest("Users are already friends.");

            var request = new FriendRequest
            {
                SenderId = currentUserId,
                ReceiverId = dto.ReceiverId,
                Status = "Pending"
            };

            _context.FriendRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(request);
        }

        [HttpGet]
        public async Task<IActionResult> GetMine()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var requests = await _context.FriendRequests
                .Where(fr => fr.SenderId == currentUserId || fr.ReceiverId == currentUserId)
                .Select(fr => new
                {
                    fr.Id,
                    fr.SenderId,
                    fr.ReceiverId,
                    fr.Status,
                    fr.CreatedAt
                })
                .ToListAsync();

            return Ok(requests);
        }
    }
}