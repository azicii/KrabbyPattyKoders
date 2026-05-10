using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KBK___Picability.Migrations
{
    /// <inheritdoc />
    public partial class AddStreakTablesAndCompletionLogic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IntervalHours",
                table: "Streaks",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IntervalHours",
                table: "Streaks");
        }
    }
}
