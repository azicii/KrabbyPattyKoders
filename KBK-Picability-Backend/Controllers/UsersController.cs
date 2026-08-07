using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.Services;
using System.Security.Claims;
using Picability.DTOs;

namespace Picability.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var user = await _context.Users
                .Where(u => u.Id == currentUserId)
                .Select(u => new
                {
                    u.Id,
                    u.UserName,
                    u.Email
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound();

            return Ok(user);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers(
    [FromQuery] string query)
        {
            var currentUserId =
                GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var normalizedQuery =
                query?.Trim();

            if (
                string.IsNullOrWhiteSpace(
                    normalizedQuery
                ) ||
                normalizedQuery.Length < 2
            )
            {
                return Ok(
                    Array.Empty<UserSummaryDto>()
                );
            }

            var users =
                await _context.Users
                    .AsNoTracking()
                    .Where(user =>
                        user.Id != currentUserId &&
                        user.Id !=
                            StreakyIdentity.UserId &&
                        user.UserName != null &&
                        EF.Functions.ILike(
                            user.UserName,
                            $"%{normalizedQuery}%"
                        )
                    )
                    .OrderBy(user =>
                        user.UserName
                    )
                    .Take(20)
                    .Select(user =>
                        new UserSummaryDto
                        {
                            Id = user.Id,

                            UserName =
                                user.UserName ??
                                string.Empty
                        }
                    )
                    .ToListAsync();

            return Ok(users);
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetPublicUser(
            string userId)
        {
            var currentUserId =
                GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized();
            }

            if (
                string.IsNullOrWhiteSpace(
                    userId
                ) ||
                userId ==
                    StreakyIdentity.UserId
            )
            {
                return NotFound();
            }

            var user =
                await _context.Users
                    .AsNoTracking()
                    .Where(user =>
                        user.Id == userId
                    )
                    .Select(user =>
                        new UserSummaryDto
                        {
                            Id = user.Id,

                            UserName =
                                user.UserName ??
                                string.Empty
                        }
                    )
                    .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound();
            }

            return Ok(user);
        }
    }
}