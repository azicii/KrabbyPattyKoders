namespace Picability.DTOs
{
    public class LoginDto
    {
        // Map the JSON from a React fetch call
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}