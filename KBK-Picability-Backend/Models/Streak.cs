namespace Picability.Models
{
    // This is the actual accepted streak after a request is approved.
    public class Streak
    {
        public int Id { get; set; }

        public string UserOneId { get; set; } = string.Empty;
        public ApplicationUser UserOne { get; set; } = null!;

        public string UserTwoId { get; set; } = string.Empty;
        public ApplicationUser UserTwo { get; set; } = null!;

        public string HabitName { get; set; } = string.Empty;
        public int CurrentCount { get; set; } = 0;
        public bool IsActive { get; set; } = true;

        public int StreakRequestId { get; set; }
        public StreakRequest StreakRequest { get; set; } = null!;

        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    }
}