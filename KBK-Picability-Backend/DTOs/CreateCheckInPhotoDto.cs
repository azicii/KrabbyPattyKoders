namespace Picability.DTOs
{
    public class CreateCheckInPhotoDto
    {
        public int StreakId { get; set; }
        public string SenderId { get; set; } = string.Empty;
        public string PhotoDataUrl { get; set; } = string.Empty;
        public int ViewDurationSeconds { get; set; } = 10;
    }
}