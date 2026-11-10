using System;

namespace Picability.Models
{
    public class UserBlock
    {
        public int Id { get; set; }

        public string BlockerId { get; set; } = string.Empty;
        public ApplicationUser Blocker { get; set; } = null!;

        public string BlockedUserId { get; set; } = string.Empty;
        public ApplicationUser BlockedUser { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}