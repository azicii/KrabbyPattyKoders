using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.Models;
using System.Security.Claims;

namespace Picability.Controllers;

[ApiController]
[Authorize]
[Route("api/user-blocks")]
public class UserBlocksController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public UserBlocksController(ApplicationDbContext db)
    {
        _db = db;
    }

    private string? CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    public async Task<IActionResult> GetBlockedUsers()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var blocked = await _db.UserBlocks
            .AsNoTracking()
            .Where(b => b.BlockerId == userId)
            .Select(b => new
            {
                userId = b.BlockedUserId,
                userName = b.BlockedUser.UserName,
                blockedAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(blocked);
    }

    [HttpPost("{targetUserId}")]
    public async Task<IActionResult> BlockUser(string targetUserId)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        if (targetUserId == userId)
            return BadRequest(new { message = "You cannot block yourself." });

        if (!await _db.Users.AnyAsync(u => u.Id == targetUserId))
            return NotFound(new { message = "User not found." });

        await using var tx = await _db.Database.BeginTransactionAsync();

        try
        {
            var exists = await _db.UserBlocks.AnyAsync(b =>
                b.BlockerId == userId &&
                b.BlockedUserId == targetUserId);

            if (exists)
            {
                await tx.RollbackAsync();
                return Ok(new { message = "User is already blocked." });
            }

            _db.UserBlocks.Add(new UserBlock
            {
                BlockerId = userId,
                BlockedUserId = targetUserId,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            // A shared streak must contain BOTH users.
            var streakIds = await _db.Streaks
                .Where(s =>
                    (
                        s.UserOneId == userId ||
                        s.UserTwoId == userId ||
                        s.Members.Any(m => m.UserId == userId)
                    ) &&
                    (
                        s.UserOneId == targetUserId ||
                        s.UserTwoId == targetUserId ||
                        s.Members.Any(m => m.UserId == targetUserId)
                    ))
                .Select(s => s.Id)
                .ToListAsync();

            // BLOCK_SAFE_SHARED_STREAK_DELETION
            // Delete only streaks that actually contain both users.
            // Never expand the deletion set to unrelated streaks.

            // Requests directly involving both users must also be removed,
            // but requests referenced by surviving streaks must be preserved.
            var candidateRequestIds = await _db.StreakRequests
                .Where(r =>
                    (r.SenderId == userId && r.ReceiverId == targetUserId) ||
                    (r.SenderId == targetUserId && r.ReceiverId == userId) ||
                    (r.Members.Any(m => m.UserId == userId) &&
                     r.Members.Any(m => m.UserId == targetUserId)) ||
                    _db.Streaks.Any(s =>
                        streakIds.Contains(s.Id) &&
                        s.StreakRequestId == r.Id))
                .Select(r => r.Id)
                .ToListAsync();

            // A request may be referenced by multiple streaks.
            // Keep it if any streak outside our deletion set uses it.
            var requestIds = await _db.StreakRequests
                .Where(r =>
                    candidateRequestIds.Contains(r.Id) &&
                    !_db.Streaks.Any(s =>
                        s.StreakRequestId == r.Id &&
                        !streakIds.Contains(s.Id)))
                .Select(r => r.Id)
                .ToListAsync();
            var contentIds = await _db.CheckInContents
                .Where(c => streakIds.Contains(c.StreakId))
                .Select(c => c.Id)
                .ToListAsync();

            await _db.CheckInContentRecipients
                .Where(r => contentIds.Contains(r.CheckInContentId))
                .ExecuteDeleteAsync();

            await _db.CheckInContents
                .Where(c => contentIds.Contains(c.Id))
                .ExecuteDeleteAsync();

            await _db.AutomaticStreakReminders
                .Where(r => streakIds.Contains(r.StreakId))
                .ExecuteDeleteAsync();

            await _db.StreakComments
                .Where(c => streakIds.Contains(c.StreakId))
                .ExecuteDeleteAsync();

            await _db.StreakReactions
                .Where(r => streakIds.Contains(r.StreakId))
                .ExecuteDeleteAsync();

            await _db.StreakCheckIns
                .Where(c => streakIds.Contains(c.StreakId))
                .ExecuteDeleteAsync();

            await _db.StreakMembers
                .Where(m => streakIds.Contains(m.StreakId))
                .ExecuteDeleteAsync();

            await _db.Streaks
                .Where(s => streakIds.Contains(s.Id))
                .ExecuteDeleteAsync();

            await _db.StreakRequestMembers
                .Where(m => requestIds.Contains(m.StreakRequestId))
                .ExecuteDeleteAsync();

            await _db.StreakRequests
                .Where(r => requestIds.Contains(r.Id))
                .ExecuteDeleteAsync();

            // Remove both directions of the friendship.
            await _db.Friends
                .Where(f =>
                    (f.UserId == userId && f.FriendId == targetUserId) ||
                    (f.UserId == targetUserId && f.FriendId == userId))
                .ExecuteDeleteAsync();

            await _db.FriendRequests
                .Where(r =>
                    (r.SenderId == userId && r.ReceiverId == targetUserId) ||
                    (r.SenderId == targetUserId && r.ReceiverId == userId))
                .ExecuteDeleteAsync();

            await tx.CommitAsync();

            return Ok(new
            {
                message = "User blocked successfully.",
                deletedStreakCount = streakIds.Count
            });
        }
        catch
        {
            await tx.RollbackAsync();

            return StatusCode(500, new
            {
                message = "Blocking failed; changes were rolled back."
            });
        }
    }

    [HttpDelete("{targetUserId}")]
    public async Task<IActionResult> UnblockUser(string targetUserId)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var block = await _db.UserBlocks.FirstOrDefaultAsync(b =>
            b.BlockerId == userId &&
            b.BlockedUserId == targetUserId);

        if (block == null)
            return NotFound(new { message = "Block not found." });

        _db.UserBlocks.Remove(block);
        await _db.SaveChangesAsync();

        return Ok(new { message = "User unblocked successfully." });
    }
}