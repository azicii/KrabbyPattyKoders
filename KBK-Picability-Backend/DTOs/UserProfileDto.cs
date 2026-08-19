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

        public string? HighestStreakIcon { get; set; }

        public int ActiveStreakCount { get; set; }

        public string RankEmoji { get; set; } =
            "—";

        public string RankTitle { get; set; } =
            "Unranked";

        // "Self"
        // "Friends"
        // "RequestSent"
        // "RequestReceived"
        // "None"
        public string RelationshipStatus { get; set; } =
            "None";
    }
}