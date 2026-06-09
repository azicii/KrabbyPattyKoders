namespace Picability.DTOs
{
    public class CreateCheckInMessageDto
    {
        public int StreakId { get; set; }

        public string SenderId { get; set; } = string.Empty;

        public string MessageText { get; set; } = string.Empty;

        public int ViewDurationSeconds { get; set; } = 10;
    }
}