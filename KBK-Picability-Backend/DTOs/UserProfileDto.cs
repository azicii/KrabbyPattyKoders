namespace Picability.DTOs
{
    public class UserProfileDto
    {
        public string Id { get; set; } =
            string.Empty;

        public string UserName { get; set; } =
            string.Empty;

        public int HighestStreakCount { get; set; }

        public string? HighestStreakName { get; set; }

        public int ActiveStreakCount { get; set; }

        public int TotalStreakCount { get; set; }

        // "Self"
        // "Friends"
        // "RequestSent"
        // "RequestReceived"
        // "None"
        public string RelationshipStatus { get; set; } =
            "None";
    }
}