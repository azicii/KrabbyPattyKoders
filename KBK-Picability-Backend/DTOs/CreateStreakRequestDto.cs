namespace Picability.DTOs
{
    public class CreateStreakRequestDto
    {
        public string SenderId { get; set; } = string.Empty;
        public string ReceiverId { get; set; } = string.Empty;

        public string HabitName { get; set; } = string.Empty;
        public string HabitIcon { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;

        public int RequiredCheckIns { get; set; } = 1;
        public int CycleLength { get; set; } = 1;
        public string CycleUnit { get; set; } = "Day";
    }
}