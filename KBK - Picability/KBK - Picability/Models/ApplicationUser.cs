using Microsoft.AspNetCore.Identity;

namespace Picability.Models
{
    // Need email/password auth and user info saved on registration. ASP.NET Identity is being used for this.
    // IdentityUser class gives Id, Email, PasswordHash, and UserName, directly helping with enable email/password auth, save user info (username, email, ID) upon registration, and setup Users table data model in C#
    public class ApplicationUser : IdentityUser
    {
        public string UserNameDisplay { get; set; } = string.Empty;

        // Navigation properties
        public ICollection<FriendRequest> SentFriendRequests { get; set; } = new List<FriendRequest>();
        public ICollection<FriendRequest> ReceivedFriendRequests { get; set; } = new List<FriendRequest>();
    }
} 