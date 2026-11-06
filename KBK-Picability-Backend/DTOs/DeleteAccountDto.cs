using System.ComponentModel.DataAnnotations;

namespace Picability.DTOs
{
    public class DeleteAccountDto
    {
        [Required]
        public string Password { get; set; } = string.Empty;
    }
}