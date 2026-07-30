using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace KBK___Picability.Migrations
{
    /// <inheritdoc />
    public partial class AddCheckInContentRecipients : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Streaks_UserOneId_UserTwoId_HabitName",
                table: "Streaks");

            migrationBuilder.CreateTable(
                name: "CheckInContentRecipients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CheckInContentId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    IsViewed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckInContentRecipients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CheckInContentRecipients_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CheckInContentRecipients_CheckInContents_CheckInContentId",
                        column: x => x.CheckInContentId,
                        principalTable: "CheckInContents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Streaks_UserOneId_UserTwoId_HabitName",
                table: "Streaks",
                columns: new[] { "UserOneId", "UserTwoId", "HabitName" });

            migrationBuilder.CreateIndex(
                name: "IX_CheckInContentRecipients_CheckInContentId_UserId",
                table: "CheckInContentRecipients",
                columns: new[] { "CheckInContentId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CheckInContentRecipients_UserId",
                table: "CheckInContentRecipients",
                column: "UserId");

            migrationBuilder.Sql(
    """
    INSERT INTO "CheckInContentRecipients"
        (
            "CheckInContentId",
            "UserId",
            "IsViewed",
            "ViewedAt"
        )
    SELECT
        "Id",
        "ReceiverId",
        "IsViewed",
        "ViewedAt"
    FROM "CheckInContents"
    WHERE
        "ReceiverId" IS NOT NULL
        AND "ReceiverId" <> '';
    """
);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CheckInContentRecipients");

            migrationBuilder.DropIndex(
                name: "IX_Streaks_UserOneId_UserTwoId_HabitName",
                table: "Streaks");

            migrationBuilder.CreateIndex(
                name: "IX_Streaks_UserOneId_UserTwoId_HabitName",
                table: "Streaks",
                columns: new[] { "UserOneId", "UserTwoId", "HabitName" },
                unique: true);
        }
    }
}
