using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace KBK___Picability.Migrations
{
    /// <inheritdoc />
    public partial class AddFlexibleStreakScheduleFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CycleLength",
                table: "Streaks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CycleUnit",
                table: "Streaks",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "RequiredCheckIns",
                table: "Streaks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CycleLength",
                table: "StreakRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CycleUnit",
                table: "StreakRequests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "RequiredCheckIns",
                table: "StreakRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "StreakCheckIns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StreakId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    CheckedInAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StreakCheckIns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StreakCheckIns_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StreakCheckIns_Streaks_StreakId",
                        column: x => x.StreakId,
                        principalTable: "Streaks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StreakCheckIns_StreakId_UserId_CheckedInAt",
                table: "StreakCheckIns",
                columns: new[] { "StreakId", "UserId", "CheckedInAt" });

            migrationBuilder.CreateIndex(
                name: "IX_StreakCheckIns_UserId",
                table: "StreakCheckIns",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StreakCheckIns");

            migrationBuilder.DropColumn(
                name: "CycleLength",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "CycleUnit",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "RequiredCheckIns",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "CycleLength",
                table: "StreakRequests");

            migrationBuilder.DropColumn(
                name: "CycleUnit",
                table: "StreakRequests");

            migrationBuilder.DropColumn(
                name: "RequiredCheckIns",
                table: "StreakRequests");
        }
    }
}
