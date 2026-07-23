using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KBK___Picability.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceLegacyStreakPairUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(
    MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name:
                    "IX_Streaks_UserOneId_UserTwoId_HabitName",

                table:
                    "Streaks"
            );

            migrationBuilder.CreateIndex(
                name:
                    "IX_Streaks_UserOneId_UserTwoId_HabitName",

                table:
                    "Streaks",

                columns:
                    new[]
                    {
                "UserOneId",
                "UserTwoId",
                "HabitName"
                    }
            );
        }

        /// <inheritdoc />
        protected override void Down(
    MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name:
                    "IX_Streaks_UserOneId_UserTwoId_HabitName",

                table:
                    "Streaks"
            );

            migrationBuilder.CreateIndex(
                name:
                    "IX_Streaks_UserOneId_UserTwoId_HabitName",

                table:
                    "Streaks",

                columns:
                    new[]
                    {
                "UserOneId",
                "UserTwoId",
                "HabitName"
                    },

                unique:
                    true
            );
        }
    }
}
