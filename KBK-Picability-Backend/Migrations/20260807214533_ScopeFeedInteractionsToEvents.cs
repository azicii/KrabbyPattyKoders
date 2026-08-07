using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KBK___Picability.Migrations
{
    /// <inheritdoc />
    public partial class ScopeFeedInteractionsToEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StreakReactions_StreakId_UserId",
                table: "StreakReactions");

            migrationBuilder.DropIndex(
                name: "IX_StreakComments_StreakId_CreatedAt",
                table: "StreakComments");

            migrationBuilder.AddColumn<DateTime>(
                name: "FeedEventAt",
                table: "StreakReactions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "FeedEventAt",
                table: "StreakComments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_StreakReactions_StreakId_UserId_FeedEventAt",
                table: "StreakReactions",
                columns: new[] { "StreakId", "UserId", "FeedEventAt" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StreakComments_StreakId_FeedEventAt_CreatedAt",
                table: "StreakComments",
                columns: new[] { "StreakId", "FeedEventAt", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StreakReactions_StreakId_UserId_FeedEventAt",
                table: "StreakReactions");

            migrationBuilder.DropIndex(
                name: "IX_StreakComments_StreakId_FeedEventAt_CreatedAt",
                table: "StreakComments");

            migrationBuilder.DropColumn(
                name: "FeedEventAt",
                table: "StreakReactions");

            migrationBuilder.DropColumn(
                name: "FeedEventAt",
                table: "StreakComments");

            migrationBuilder.CreateIndex(
                name: "IX_StreakReactions_StreakId_UserId",
                table: "StreakReactions",
                columns: new[] { "StreakId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StreakComments_StreakId_CreatedAt",
                table: "StreakComments",
                columns: new[] { "StreakId", "CreatedAt" });
        }
    }
}
