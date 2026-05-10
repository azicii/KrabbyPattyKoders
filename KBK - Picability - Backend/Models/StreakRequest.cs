namespace Picability.Models
{
    // This is the request someone sends to start a streak with a friend.
    public class StreakRequest
    {
        public int Id { get; set; }

        public string SenderId { get; set; } = string.Empty;
        public ApplicationUser Sender { get; set; } = null!;

        public string ReceiverId { get; set; } = string.Empty;
        public ApplicationUser Receiver { get; set; } = null!;

        public string HabitName { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}