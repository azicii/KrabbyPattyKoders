namespace Picability.DTOs
{
    public class CreateStreakRequestDto
    {
        public string SenderId { get; set; } = string.Empty;

        // Existing standard 2-person streak flow.
        public string ReceiverId { get; set; } = string.Empty;

        // Group streak flow.
        // The creator is automatically included and should NOT
        // be included in this collection.
        public List<string> ReceiverIds { get; set; } = new();

        public bool IsGroupRequest { get; set; } = false;

        public string HabitName { get; set; } = string.Empty;
        public string HabitIcon { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;

        public int RequiredCheckIns { get; set; } = 1;
        public int CycleLength { get; set; } = 1;
        public string CycleUnit { get; set; } = "Day";
    }
}