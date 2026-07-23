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
        public DbSet<StreakMember> StreakMembers { get; set; }
        public DbSet<StreakRequestMember> StreakRequestMembers { get; set; }

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
                .HasIndex(s => new
                {
                    s.UserOneId,
                    s.UserTwoId,
                    s.HabitName
                });

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

            builder.Entity<Streak>()
                .Property(s => s.RequiredCheckIns)
                .HasDefaultValue(1);

            builder.Entity<Streak>()
                .Property(s => s.CycleLength)
                .HasDefaultValue(1);

            builder.Entity<Streak>()
                .Property(s => s.CycleUnit)
                .HasDefaultValue("Day");

            builder.Entity<StreakRequest>()
                .Property(sr => sr.RequiredCheckIns)
                .HasDefaultValue(1);

            builder.Entity<StreakRequest>()
                .Property(sr => sr.CycleLength)
                .HasDefaultValue(1);

            builder.Entity<StreakRequest>()
                .Property(sr => sr.CycleUnit)
                .HasDefaultValue("Day");

            builder.Entity<Streak>()
                .Property(s => s.CycleTrackingStartedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Entity<StreakMember>()
                .HasOne(sm => sm.Streak)
                .WithMany(s => s.Members)
                .HasForeignKey(sm => sm.StreakId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<StreakMember>()
                .HasOne(sm => sm.User)
                .WithMany()
                .HasForeignKey(sm => sm.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<StreakMember>()
                .HasIndex(sm => new
                {
                    sm.StreakId,
                    sm.UserId
                })
                .IsUnique();

            builder.Entity<StreakMember>()
                .Property(sm => sm.VisibilityPublic)
                .HasDefaultValue(true);

            builder.Entity<StreakMember>()
                .Property(sm => sm.IsCreator)
                .HasDefaultValue(false);

            builder.Entity<StreakRequestMember>()
                .HasOne(srm => srm.StreakRequest)
                .WithMany(sr => sr.Members)
                .HasForeignKey(srm => srm.StreakRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<StreakRequestMember>()
                .HasOne(srm => srm.User)
                .WithMany()
                .HasForeignKey(srm => srm.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<StreakRequestMember>()
                .HasIndex(srm => new
                {
                    srm.StreakRequestId,
                    srm.UserId
                })
                .IsUnique();

            builder.Entity<StreakRequestMember>()
                .Property(srm => srm.Status)
                .HasDefaultValue("Pending");

            builder.Entity<Streak>()
                .HasOne(s => s.CreatedByUser)
                .WithMany()
                .HasForeignKey(s => s.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Streak>()
                .Property(s => s.IsGroupStreak)
                .HasDefaultValue(false);

            builder.Entity<StreakRequest>()
                .Property(sr => sr.IsGroupRequest)
                .HasDefaultValue(false);
        }
    }
}