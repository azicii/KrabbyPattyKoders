namespace Picability.Models
{
    public class CheckInContent
    {
        public int Id { get; set; }

        public int StreakId { get; set; }
        public Streak Streak { get; set; } = null!;

        public string SenderId { get; set; } = string.Empty;
        public ApplicationUser Sender { get; set; } = null!;

        public string ReceiverId { get; set; } = string.Empty;
        public ApplicationUser Receiver { get; set; } = null!;

        public string ContentType { get; set; } = string.Empty; // "Message" or "Photo"

        public string? MessageText { get; set; }

        public string? PhotoUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int ViewDurationSeconds { get; set; } = 10;

        public DateTime? ViewedAt { get; set; }

        public bool IsViewed { get; set; } = false;
    }
}