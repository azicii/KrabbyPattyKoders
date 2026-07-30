using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Picability.Models
{
    public class CheckInContentRecipient
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CheckInContentId { get; set; }

        [ForeignKey(nameof(CheckInContentId))]
        public CheckInContent CheckInContent { get; set; } = null!;

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; } = null!;

        public bool IsViewed { get; set; } = false;

        public DateTime? ViewedAt { get; set; }
    }
}