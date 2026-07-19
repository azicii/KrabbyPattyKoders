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

        // False for the standard two-person streak.
        // True when more than two people participate.
        public bool IsGroupStreak { get; set; } = false;

        // The user who originally created the streak.
        // Existing two-person streaks will be backfilled using UserOneId,
        // because UserOne is currently the original streak request sender.
        public string? CreatedByUserId { get; set; }

        public ApplicationUser? CreatedByUser { get; set; }

        // New participant relationship.
        // Controllers will gradually migrate to using this instead of
        // UserOneId and UserTwoId.
        public ICollection<StreakMember> Members { get; set; }
            = new List<StreakMember>();

        // Number of check-ins each participant must complete in one cycle.
        public int RequiredCheckIns { get; set; } = 1;

        // Number of units in one cycle.
        // Example: 2 + "Week" means one cycle lasts two weeks.
        public int CycleLength { get; set; } = 1;

        // Supported values: "Day", "Week", or "Month".
        public string CycleUnit { get; set; } = "Day";

        // Flexible cycle evaluation begins from this point.
        // This prevents existing streaks from being retroactively evaluated
        // against cycles that occurred before check-in history was introduced.
        public DateTime CycleTrackingStartedAt { get; set; } = DateTime.UtcNow;

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