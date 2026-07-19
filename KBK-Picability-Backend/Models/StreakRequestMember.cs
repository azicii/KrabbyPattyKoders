using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Picability.Models
{
    public class StreakRequestMember
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int StreakRequestId { get; set; }

        [ForeignKey(nameof(StreakRequestId))]
        public StreakRequest StreakRequest { get; set; } = null!;

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; } = null!;

        // Supported values:
        // "Pending"
        // "Accepted"
        // "Rejected"
        public string Status { get; set; } = "Pending";

        public DateTime? RespondedAt { get; set; }
    }
}