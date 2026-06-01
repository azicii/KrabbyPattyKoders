using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KBK___Picability.Migrations
{
    /// <inheritdoc />
    public partial class AddDualUserStreakCheckIns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastFullyCompletedAt",
                table: "Streaks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UserOneLastCheckedInAt",
                table: "Streaks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UserTwoLastCheckedInAt",
                table: "Streaks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "StreakRequests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HabitIcon",
                table: "StreakRequests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastFullyCompletedAt",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "UserOneLastCheckedInAt",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "UserTwoLastCheckedInAt",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "StreakRequests");

            migrationBuilder.DropColumn(
                name: "HabitIcon",
                table: "StreakRequests");
        }
    }
}
