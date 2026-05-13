namespace Picability.DTOs
{
    public class CreateFriendRequestDto
    {
        public string SenderId { get; set; } = string.Empty;
        public string ReceiverId { get; set; } = string.Empty;
    }
}