using Picability.Models;

public class Friend
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public string FriendId { get; set; } = string.Empty;

    public int? FriendRequestId { get; set; }

    public DateTime CreatedAt { get; set; }

    public ApplicationUser User { get; set; } = null!;
    public ApplicationUser FriendUser { get; set; } = null!;
}