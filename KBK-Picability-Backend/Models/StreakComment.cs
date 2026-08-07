using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Picability.Models
{
    public class StreakComment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int StreakId { get; set; }

        [ForeignKey(nameof(StreakId))]
        public Streak Streak { get; set; } = null!;

        [Required]
        public string UserId { get; set; } =
            string.Empty;

        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; } =
            null!;

        [Required]
        [MaxLength(500)]
        public string Text { get; set; } =
            string.Empty;

        public DateTime CreatedAt { get; set; } =
            DateTime.UtcNow;
    }
}