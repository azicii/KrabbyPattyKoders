using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using System.Security.Claims;

namespace Picability.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FriendsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FriendsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }


        [HttpPost("accept/{requestId}")]
        public async Task<IActionResult> AcceptFriendRequest(int requestId)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var request = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.Id == requestId);

            if (request == null)
                return NotFound("Request not found");

            if (request.ReceiverId != currentUserId)
                return Forbid();

            if (request.Status != "Pending")
                return BadRequest("Request already handled");


            bool alreadyFriends = await _context.Friends
                .AnyAsync(f => f.UserId == request.SenderId &&
                               f.FriendId == request.ReceiverId);

            if (alreadyFriends)
                return BadRequest("Users are already friends");

            var now = DateTime.UtcNow;

            var friendshipA = new Friend
            {
                UserId = request.SenderId,
                FriendId = request.ReceiverId,
                FriendRequestId = request.Id,
                CreatedAt = now
            };

            var friendshipB = new Friend
            {
                UserId = request.ReceiverId,
                FriendId = request.SenderId,
                FriendRequestId = request.Id,
                CreatedAt = now
            };

            _context.Friends.AddRange(friendshipA, friendshipB);

            request.Status = "Accepted";

            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpPost("reject/{requestId}")]
        public async Task<IActionResult> RejectFriendRequest(int requestId)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var request = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.Id == requestId);

            if (request == null)
                return NotFound("Request not found");

            if (request.ReceiverId != currentUserId)
                return Forbid();

            if (request.Status != "Pending")
                return BadRequest("Request already handled");

            request.Status = "Rejected";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Friend request rejected",
                requestId = request.Id,
                status = request.Status
            });
        }

        [HttpDelete("{friendId}")]
        public async Task<IActionResult> RemoveFriend(string friendId)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            // 1. Get the friendships
            var friendships = await _context.Friends
                .Where(f =>
                    (f.UserId == currentUserId && f.FriendId == friendId) ||
                    (f.UserId == friendId && f.FriendId == currentUserId))
                .ToListAsync();

            if (!friendships.Any())
                return NotFound("Friendship does not exist");

            // 2. Capture the Request ID from the friendship record before deleting it
            var requestId = friendships.First().FriendRequestId;

            // 3. Remove the friendship records first and SAVE
            // This breaks the link so the Request is no longer "in use"
            _context.Friends.RemoveRange(friendships);
            await _context.SaveChangesAsync(); 

            // 4. Now that the reference is gone, we can safely delete the Request
            var originalRequest = await _context.FriendRequests.FindAsync(requestId);
            if (originalRequest != null)
            {
                _context.FriendRequests.Remove(originalRequest);
                await _context.SaveChangesAsync();
            }

            return Ok("Friend and original request removed successfully");
        }

        [HttpGet("mine")]
        public async Task<IActionResult> GetMyFriends()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var friends = await _context.Friends
                .Where(f => f.UserId == currentUserId)
                .Select(f => new
                {
                    Id = f.FriendId,
                    UserName = f.FriendUser.UserName,
                    Email = f.FriendUser.Email
                })
                .ToListAsync();

            return Ok(friends);
        }
    }
}