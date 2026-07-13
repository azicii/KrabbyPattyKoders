namespace Picability.Models
{
    public class StreakCheckIn
    {
        public int Id { get; set; }

        public int StreakId { get; set; }
        public Streak Streak { get; set; } = null!;

        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        public DateTime CheckedInAt { get; set; } = DateTime.UtcNow;
    }
}