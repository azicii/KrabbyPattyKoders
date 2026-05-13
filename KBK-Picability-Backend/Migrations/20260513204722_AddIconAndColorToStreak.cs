using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KBK___Picability.Migrations
{
    /// <inheritdoc />
    public partial class AddIconAndColorToStreak : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Streaks",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "FailedAt",
                table: "Streaks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HabitIcon",
                table: "Streaks",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "IntervalHours",
                table: "Streaks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastCompletedAt",
                table: "Streaks",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Color",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "FailedAt",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "HabitIcon",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "IntervalHours",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "LastCompletedAt",
                table: "Streaks");
        }
    }
}
