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
        public DbSet<CheckInContent> CheckInContents { get; set; }
        public DbSet<StreakReaction> StreakReactions { get; set; }
        public DbSet<PushSubscription> PushSubscriptions { get; set; }
        public DbSet<StreakCheckIn> StreakCheckIns { get; set; }

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

            builder.Entity<CheckInContent>()
                .HasOne(c => c.Sender)
                .WithMany()
                .HasForeignKey(c => c.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<CheckInContent>()
                .HasOne(c => c.Receiver)
                .WithMany()
                .HasForeignKey(c => c.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<CheckInContent>()
                .HasOne(c => c.Streak)
                .WithMany()
                .HasForeignKey(c => c.StreakId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<StreakReaction>()
                .HasOne(r => r.Streak)
                .WithMany()
                .HasForeignKey(r => r.StreakId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<StreakReaction>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<StreakReaction>()
                .HasIndex(r => new { r.StreakId, r.UserId })
                .IsUnique();

            builder.Entity<PushSubscription>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PushSubscription>()
                .HasIndex(p => p.Endpoint)
                .IsUnique();

            builder.Entity<StreakCheckIn>()
                .HasOne(c => c.Streak)
                .WithMany()
                .HasForeignKey(c => c.StreakId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<StreakCheckIn>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<StreakCheckIn>()
                .HasIndex(c => new
                {
                    c.StreakId,
                    c.UserId,
                    c.CheckedInAt
                });
        }
    }
}