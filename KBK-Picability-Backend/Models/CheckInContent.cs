namespace Picability.Models
{
    public class CheckInContent
    {
        public int Id { get; set; }

        public int StreakId { get; set; }
        public Streak Streak { get; set; } = null!;

        public string SenderId { get; set; } = string.Empty;
        public ApplicationUser Sender { get; set; } = null!;

        /*
         * Legacy compatibility field.
         *
         * New code uses Recipients as the source of truth.
         * For newly created content, this stores the first recipient.
         */
        public string ReceiverId { get; set; } = string.Empty;
        public ApplicationUser Receiver { get; set; } = null!;

        public ICollection<CheckInContentRecipient> Recipients { get; set; }
            = new List<CheckInContentRecipient>();

        public string ContentType { get; set; } = string.Empty;

        /*
         * Position of this content's associated check-in
         * within the current cycle.
         */
        public int CheckInNumber { get; set; } = 1;

        /*
         * Snapshot of the required check-ins when the
         * content was created.
         */
        public int RequiredCheckIns { get; set; } = 1;

        public string? MessageText { get; set; }

        public string? PhotoUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int ViewDurationSeconds { get; set; } = 10;

        /*
         * Legacy fields retained during the transition.
         * Recipient-level viewing is stored in Recipients.
         */
        public DateTime? ViewedAt { get; set; }

        public bool IsViewed { get; set; } = false;
    }
}