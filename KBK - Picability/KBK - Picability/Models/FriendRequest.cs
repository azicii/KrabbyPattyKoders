namespace Picability.Models
{
    // this helps store friend requests in database
    // this also links friend request senders + receiver IDs because SenderId and ReceiverId are foreign keys to users table.
    public class FriendRequest
    {
       
        public int Id { get; set; } 

     
        public string SenderId { get; set; } = string.Empty;

        
        public ApplicationUser Sender { get; set; } = null!;

        
        public string ReceiverId { get; set; } = string.Empty;

      
        public ApplicationUser Receiver { get; set; } = null!;

   
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}