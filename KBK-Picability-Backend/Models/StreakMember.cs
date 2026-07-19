using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Picability.Models
{
    public class StreakMember
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int StreakId { get; set; }

        [ForeignKey(nameof(StreakId))]
        public Streak Streak { get; set; } = null!;

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; } = null!;

        // The user who originally created the streak invitation.
        public bool IsCreator { get; set; } = false;

        // Visibility now belongs to the member rather than being limited
        // to UserOneVisibilityPublic / UserTwoVisibilityPublic.
        public bool VisibilityPublic { get; set; } = true;

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}