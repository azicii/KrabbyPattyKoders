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
        public string HabitIcon { get; set; } = "Target"; 
        public string Color { get; set; } = "from-teal-500 to-cyan-500"; 
        public int CurrentCount { get; set; } = 0;
        public bool IsActive { get; set; } = true;

        public int StreakRequestId { get; set; }
        public StreakRequest StreakRequest { get; set; } = null!;

        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastCompletedAt { get; set; }
        public DateTime? FailedAt { get; set; }
        public int IntervalHours { get; set; } = 24;

        public DateTime? UserOneLastCheckedInAt { get; set; }
        public DateTime? UserTwoLastCheckedInAt { get; set; }
        public DateTime? LastFullyCompletedAt { get; set; }
        public bool UserOneVisibilityPublic { get; set; } = true;
        public bool UserTwoVisibilityPublic { get; set; } = true;
    }
}