namespace Picability.DTOs
{
    public class CreateStreakRequestDto
    {
        public string SenderId { get; set; } = string.Empty;
        public string ReceiverId { get; set; } = string.Empty;
        public string HabitName { get; set; } = string.Empty;
    }
}