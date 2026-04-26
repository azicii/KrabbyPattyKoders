using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Picability.Models;

namespace Picability.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<FriendRequest> FriendRequests { get; set; }
        public DbSet<Friend> Friends { get; set; }
        public DbSet<StreakRequest> StreakRequests { get; set; }
        public DbSet<Streak> Streaks { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<FriendRequest>()
                .HasOne(fr => fr.Sender)
                .WithMany(u => u.SentFriendRequests)
                .HasForeignKey(fr => fr.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<FriendRequest>()
                .HasOne(fr => fr.Receiver)
                .WithMany(u => u.ReceivedFriendRequests)
                .HasForeignKey(fr => fr.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Friend>().ToTable("FriendsList")
                .HasOne(f => f.User)
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Friend>().ToTable("FriendsList")
                .HasOne(f => f.FriendUser)
                .WithMany()
                .HasForeignKey(f => f.FriendId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Friend>().ToTable("FriendsList")
                .HasIndex(f => new { f.UserId, f.FriendId })
                .IsUnique();

            builder.Entity<StreakRequest>()
                .HasOne(sr => sr.Sender)
                .WithMany()
                .HasForeignKey(sr => sr.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<StreakRequest>()
                .HasOne(sr => sr.Receiver)
                .WithMany()
                .HasForeignKey(sr => sr.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Streak>()
                .HasOne(s => s.UserOne)
                .WithMany()
                .HasForeignKey(s => s.UserOneId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Streak>()
                .HasOne(s => s.UserTwo)
                .WithMany()
                .HasForeignKey(s => s.UserTwoId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Streak>()
                .HasOne(s => s.StreakRequest)
                .WithMany()
                .HasForeignKey(s => s.StreakRequestId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Streak>()
                .HasIndex(s => new { s.UserOneId, s.UserTwoId, s.HabitName })
                .IsUnique();
        }
    }
}