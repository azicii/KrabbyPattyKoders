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
    public class PushSubscriptionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PushNotificationService _pushNotificationService;

        public PushSubscriptionsController(
            ApplicationDbContext context,
            PushNotificationService pushNotificationService)
        {
            _context = context;
            _pushNotificationService = pushNotificationService;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        [HttpPost]
        public async Task<IActionResult> SaveSubscription([FromBody] SavePushSubscriptionDto dto)
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.Endpoint) ||
                string.IsNullOrWhiteSpace(dto.Keys.P256dh) ||
                string.IsNullOrWhiteSpace(dto.Keys.Auth))
            {
                return BadRequest(new { message = "Invalid push subscription." });
            }

            var existing = await _context.PushSubscriptions
                .FirstOrDefaultAsync(p => p.Endpoint == dto.Endpoint);

            if (existing == null)
            {
                _context.PushSubscriptions.Add(new PushSubscription
                {
                    UserId = userId,
                    Endpoint = dto.Endpoint,
                    P256dh = dto.Keys.P256dh,
                    Auth = dto.Keys.Auth,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.UserId = userId;
                existing.P256dh = dto.Keys.P256dh;
                existing.Auth = dto.Keys.Auth;
                existing.LastUsedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Push subscription saved." });
        }

        [HttpGet("mine")]
        public async Task<IActionResult> GetMySubscriptions()
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var subscriptions = await _context.PushSubscriptions
                .Where(p => p.UserId == userId)
                .Select(p => new
                {
                    p.Id,
                    p.Endpoint,
                    p.CreatedAt,
                    p.LastUsedAt
                })
                .ToListAsync();

            return Ok(subscriptions);
        }

        [HttpPost("test")]
        public async Task<IActionResult> SendTestPush()
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _pushNotificationService.NotifyPartnerCheckedInAsync(
                userId,
                "Picability",
                "Test Streak",
                1,
                false,
                false,
                false
            );

            return Ok(result);
        }
    }
}