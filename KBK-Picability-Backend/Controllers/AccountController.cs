using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.DTOs;
using Picability.Models;
using System.Security.Claims;

namespace Picability.Controllers;

[ApiController]
[Authorize]
[Route("api/account")]
public class AccountController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _users;
    private readonly IConfiguration _config;

    public AccountController(ApplicationDbContext db, UserManager<ApplicationUser> users, IConfiguration config)
    {
        _db = db;
        _users = users;
        _config = config;
    }

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe([FromBody] DeleteAccountDto request)
    {
        // Deliberately disabled until the workflow is verified against an isolated database.
        if (!_config.GetValue<bool>("AccountDeletion:Enabled"))
            return StatusCode(503, new { message = "Account deletion is not yet enabled." });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
        var user = await _users.FindByIdAsync(userId);
        if (user == null) return Unauthorized();
        if (!await _users.CheckPasswordAsync(user, request.Password))
            return BadRequest(new { message = "Incorrect password." });
        // Delete all participating streaks, including group streaks.

        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            // Start with every streak involving the deleting account.
            var streakIds = await _db.Streaks.Where(s =>
                s.UserOneId == userId ||
                s.UserTwoId == userId ||
                s.CreatedByUserId == userId ||
                s.Members.Any(m => m.UserId == userId))
                .Select(s => s.Id).ToListAsync();

            // Delete requests owned by the account, plus requests
            // belonging to streaks that are being deleted.
            var requestIds = await _db.StreakRequests.Where(r =>
                r.SenderId == userId ||
                r.ReceiverId == userId ||
                _db.Streaks.Any(s =>
                    s.StreakRequestId == r.Id &&
                    streakIds.Contains(s.Id)))
                .Select(r => r.Id).ToListAsync();

            // A request can be referenced by more than one streak.
            // Include those dependent streaks before deleting the request.
            // Repeat until no additional related records are found.
            bool changed;
            do
            {
                var linkedStreakIds = await _db.Streaks
                    .Where(s => requestIds.Contains(s.StreakRequestId))
                    .Select(s => s.Id)
                    .ToListAsync();

                var newStreakIds = linkedStreakIds
                    .Except(streakIds)
                    .ToList();

                streakIds.AddRange(newStreakIds);

                var linkedRequestIds = await _db.Streaks
                    .Where(s => streakIds.Contains(s.Id))
                    .Select(s => s.StreakRequestId)
                    .Distinct()
                    .ToListAsync();

                var newRequestIds = linkedRequestIds
                    .Except(requestIds)
                    .ToList();

                requestIds.AddRange(newRequestIds);

                changed = newStreakIds.Count > 0 ||
                          newRequestIds.Count > 0;
            }
            while (changed);
            // Remove content involving this account even if it belongs to another streak.
            var contentIds = await _db.CheckInContents.Where(c =>
                streakIds.Contains(c.StreakId) || c.SenderId == userId ||
                c.ReceiverId == userId || c.Recipients.Any(r => r.UserId == userId))
                .Select(c => c.Id).ToListAsync();

            await _db.CheckInContentRecipients.Where(r => contentIds.Contains(r.CheckInContentId)).ExecuteDeleteAsync();
            await _db.CheckInContents.Where(c => contentIds.Contains(c.Id)).ExecuteDeleteAsync();
            await _db.AutomaticStreakReminders.Where(r => streakIds.Contains(r.StreakId) || r.UserId == userId).ExecuteDeleteAsync();
            await _db.StreakComments.Where(c => streakIds.Contains(c.StreakId) || c.UserId == userId).ExecuteDeleteAsync();
            await _db.StreakReactions.Where(r => streakIds.Contains(r.StreakId) || r.UserId == userId).ExecuteDeleteAsync();
            await _db.StreakCheckIns.Where(c => streakIds.Contains(c.StreakId) || c.UserId == userId).ExecuteDeleteAsync();
            await _db.StreakMembers.Where(m => streakIds.Contains(m.StreakId) || m.UserId == userId).ExecuteDeleteAsync();
            await _db.Streaks.Where(s => streakIds.Contains(s.Id)).ExecuteDeleteAsync();
            await _db.StreakRequestMembers.Where(m => requestIds.Contains(m.StreakRequestId) || m.UserId == userId).ExecuteDeleteAsync();
            await _db.StreakRequests.Where(r => requestIds.Contains(r.Id)).ExecuteDeleteAsync();
            await _db.Friends.Where(f => f.UserId == userId || f.FriendId == userId).ExecuteDeleteAsync();
            await _db.FriendRequests.Where(r => r.SenderId == userId || r.ReceiverId == userId).ExecuteDeleteAsync();
            await _db.PushSubscriptions.Where(p => p.UserId == userId).ExecuteDeleteAsync();
            var result = await _users.DeleteAsync(user);
            if (!result.Succeeded) throw new InvalidOperationException("Identity account removal failed.");
            await tx.CommitAsync();
            return Ok(new { message = "Account deleted." });
        }
        catch (Exception)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { message = "Account deletion failed; changes were rolled back." });
        }
    }
}
