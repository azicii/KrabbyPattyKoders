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
        
        // MODIFIED BY REECE
        // Before: This method would delete friendship records from the
        // friends table in the db, but friend requests would remain in the 
        // db as "accepted". This caused the unfriended user to be unable to 
        // appear in the unfriending user's friend search results as the system
        // still considered them to be friends.
        // After: Method now also deletes the original friend request, allowing
        // the unfriended user to be re-added in the future (and cleans up the db).
        [HttpDelete("{userId}/{friendId}")]
        public async Task<IActionResult> RemoveFriend(string userId, string friendId)
        {
            // 1. Get the friendships
            var friendships = await _context.Friends
                .Where(f =>
                    (f.UserId == userId && f.FriendId == friendId) ||
                    (f.UserId == friendId && f.FriendId == userId))
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

        // ADDED BY REECE
        // Before: No endpoint for the UI to fetch a user's friends for the 
        // friend list
        // After: Added this endpoint to fetch a user's friends for the friend list
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetFriends(string userId)
        {
            var friends = await _context.Friends
                .Where(f => f.UserId == userId)
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