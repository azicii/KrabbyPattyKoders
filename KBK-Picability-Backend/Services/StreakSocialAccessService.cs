using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.Models;

namespace Picability.Services;

public class StreakSocialAccessService
{
    private readonly ApplicationDbContext _db;

    public StreakSocialAccessService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<bool> CanAccessAsync(
        Streak streak,
        string currentUserId)
    {
        var participantIds = streak.Members
            .Select(m => m.UserId)
            .Append(streak.UserOneId)
            .Append(streak.UserTwoId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToList();

        var blocked = await _db.UserBlocks
            .AsNoTracking()
            .AnyAsync(b =>
                (b.BlockerId == currentUserId &&
                 participantIds.Contains(b.BlockedUserId)) ||
                (b.BlockedUserId == currentUserId &&
                 participantIds.Contains(b.BlockerId)));

        if (blocked)
            return false;

        if (participantIds.Contains(currentUserId))
            return true;

        var friendIds = await _db.FriendRequests
            .Where(fr =>
                fr.Status == "Accepted" &&
                (fr.SenderId == currentUserId ||
                 fr.ReceiverId == currentUserId))
            .Select(fr =>
                fr.SenderId == currentUserId
                    ? fr.ReceiverId
                    : fr.SenderId)
            .Distinct()
            .ToListAsync();

        return streak.Members.Any(m =>
                   friendIds.Contains(m.UserId) &&
                   m.VisibilityPublic) ||
               (friendIds.Contains(streak.UserOneId) &&
                streak.UserOneVisibilityPublic) ||
               (friendIds.Contains(streak.UserTwoId) &&
                streak.UserTwoVisibilityPublic);
    }

    public static DateTime? CurrentFeedEventAt(Streak streak)
    {
        var eventAt = streak.IsActive
            ? streak.LastFullyCompletedAt
            : streak.FailedAt;

        if (!eventAt.HasValue || eventAt.Value == default)
            return null;

        TimeZoneInfo pacific;

        try
        {
            pacific = TimeZoneInfo.FindSystemTimeZoneById(
                "Pacific Standard Time");
        }
        catch
        {
            pacific = TimeZoneInfo.FindSystemTimeZoneById(
                "America/Los_Angeles");
        }

        var eventDate = TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(eventAt.Value, DateTimeKind.Utc),
            pacific).Date;

        var today = TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.UtcNow,
            pacific).Date;

        return eventDate == today ? eventAt.Value : null;
    }
}