using Microsoft.AspNetCore.Identity;
using Picability.Models;

public class ApplicationUser : IdentityUser
{
    public string UserNameDisplay { get; set; } = string.Empty;

    /*
     * Permanent profile record.
     *
     * These values survive even after the streak that produced
     * them is eventually deleted from the database.
     *
     * We intentionally do not backfill historical streak data.
     */
    public int BestStreakCount { get; set; } = 0;

    public string? BestStreakName { get; set; }

    public string? BestStreakIcon { get; set; }

    // Navigation properties
    public ICollection<FriendRequest> SentFriendRequests { get; set; } =
        new List<FriendRequest>();

    public ICollection<FriendRequest> ReceivedFriendRequests { get; set; } =
        new List<FriendRequest>();
}