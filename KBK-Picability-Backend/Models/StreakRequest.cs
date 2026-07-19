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

        public string HabitIcon { get; set; } = "Target"; 
        public string Color { get; set; } = "from-teal-500 to-teal-600";
        public int RequiredCheckIns { get; set; } = 1;

        public int CycleLength { get; set; } = 1;

        // Supported values will be "Day", "Week", or "Month".
        public string CycleUnit { get; set; } = "Day";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // False for the existing standard two-person request.
        // True when one request contains multiple invited members.
        public bool IsGroupRequest { get; set; } = false;

        // Group requests will use this collection to track each
        // invited user's individual response.
        public ICollection<StreakRequestMember> Members { get; set; }
            = new List<StreakRequestMember>();
    }
}