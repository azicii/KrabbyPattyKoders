using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;

namespace Picability.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FriendsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FriendsController(ApplicationDbContext context)
        {
            _context = context;
        }


        [HttpPost("accept/{requestId}")]
        public async Task<IActionResult> AcceptFriendRequest(int requestId)
        {
            var request = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.Id == requestId);

            if (request == null)
                return NotFound("Request not found");

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
            var request = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.Id == requestId);

            if (request == null)
                return NotFound("Request not found");

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

        [HttpDelete("{userId}/{friendId}")]
        public async Task<IActionResult> RemoveFriend(string userId, string friendId)
        {
            var friendships = await _context.Friends
                .Where(f =>
                    (f.UserId == userId && f.FriendId == friendId) ||
                    (f.UserId == friendId && f.FriendId == userId))
                .ToListAsync();

            if (!friendships.Any())
                return NotFound("Friendship does not exist");

            _context.Friends.RemoveRange(friendships);

            await _context.SaveChangesAsync();

            return Ok("Friend removed successfully");
        }
    }
}