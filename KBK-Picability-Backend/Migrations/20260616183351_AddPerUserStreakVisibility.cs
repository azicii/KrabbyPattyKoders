using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KBK___Picability.Migrations
{
    /// <inheritdoc />
    public partial class AddPerUserStreakVisibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "UserOneVisibilityPublic",
                table: "Streaks",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "UserTwoVisibilityPublic",
                table: "Streaks",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserOneVisibilityPublic",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "UserTwoVisibilityPublic",
                table: "Streaks");
        }
    }
}
