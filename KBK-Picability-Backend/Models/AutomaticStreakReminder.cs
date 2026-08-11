using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Picability.Models
{
    public class AutomaticStreakReminder
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } =
            string.Empty;

        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; } =
            null!;

        [Required]
        public int StreakId { get; set; }

        [ForeignKey(nameof(StreakId))]
        public Streak Streak { get; set; } =
            null!;

        public DateTime CycleStartUtc { get; set; }

        public DateTime SentAt { get; set; } =
            DateTime.UtcNow;
    }
}