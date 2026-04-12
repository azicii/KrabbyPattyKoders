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