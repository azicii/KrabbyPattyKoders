using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.Models;
using Picability.DTOs;

namespace Picability.Controllers
{
    // gives very basic backend for friend requests
    [ApiController]
    [Route("api/[controller]")]
    public class FriendRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FriendRequestsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> SendFriendRequest(CreateFriendRequestDto dto)
        {
            //Prevent requesting friendship with yourself
            if (dto.SenderId == dto.ReceiverId)
            {
                return BadRequest("You cannot send a friend request to yourself.");
            }

            // Can't friend if you've already requested
            var existingRequest = await _context.FriendRequests
            .FirstOrDefaultAsync(fr =>
                 (fr.SenderId == dto.SenderId && fr.ReceiverId == dto.ReceiverId) ||
                 (fr.SenderId == dto.ReceiverId && fr.ReceiverId == dto.SenderId)
              );

            if (existingRequest != null)
            {
                return BadRequest("Friend request already exists between these users.");
            }
            //Maybe we can enhance this by auto accepting request if a reversed pending request already exists



            var request = new FriendRequest
            {
                SenderId = dto.SenderId,
                ReceiverId = dto.ReceiverId,
                Status = "Pending"
            };

            _context.FriendRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(request);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var requests = await _context.FriendRequests
                .Include(fr => fr.Sender)
                .Include(fr => fr.Receiver)
                .ToListAsync();

            return Ok(requests);
        }
    }
}