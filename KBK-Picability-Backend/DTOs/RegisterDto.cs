namespace Picability.DTOs
{
    // data transfer object (DTO) simple class used to send/receive data through API
    // use DTOs instead of database models so you control exactly what data comes in and out. 
    public class RegisterDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}