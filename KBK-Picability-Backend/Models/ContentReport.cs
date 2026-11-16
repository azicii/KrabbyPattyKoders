using System;
using System.ComponentModel.DataAnnotations;

namespace Picability.Models
{
    public class ContentReport
    {
        public int Id { get; set; }

        [Required]
        public string ReporterId { get; set; } = string.Empty;

        [Required]
        public string ReportedUserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string ContentType { get; set; } = string.Empty;

        public int? ContentId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Reason { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Details { get; set; }

        public string? EvidenceSnapshot { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAt { get; set; }

        public string? ReviewedByUserId { get; set; }
    }
}