using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KBK___Picability.Migrations
{
    /// <inheritdoc />
    public partial class AddStreakRequestAndStreakTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StreakRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SenderId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ReceiverId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    HabitName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StreakRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StreakRequests_AspNetUsers_ReceiverId",
                        column: x => x.ReceiverId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StreakRequests_AspNetUsers_SenderId",
                        column: x => x.SenderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Streaks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserOneId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserTwoId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    HabitName = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CurrentCount = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    StreakRequestId = table.Column<int>(type: "int", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Streaks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Streaks_AspNetUsers_UserOneId",
                        column: x => x.UserOneId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Streaks_AspNetUsers_UserTwoId",
                        column: x => x.UserTwoId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Streaks_StreakRequests_StreakRequestId",
                        column: x => x.StreakRequestId,
                        principalTable: "StreakRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FriendsList_FriendId",
                table: "FriendsList",
                column: "FriendId");

            migrationBuilder.CreateIndex(
                name: "IX_FriendsList_UserId_FriendId",
                table: "FriendsList",
                columns: new[] { "UserId", "FriendId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StreakRequests_ReceiverId",
                table: "StreakRequests",
                column: "ReceiverId");

            migrationBuilder.CreateIndex(
                name: "IX_StreakRequests_SenderId",
                table: "StreakRequests",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_Streaks_StreakRequestId",
                table: "Streaks",
                column: "StreakRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Streaks_UserOneId_UserTwoId_HabitName",
                table: "Streaks",
                columns: new[] { "UserOneId", "UserTwoId", "HabitName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Streaks_UserTwoId",
                table: "Streaks",
                column: "UserTwoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FriendsList");

            migrationBuilder.DropTable(
                name: "Streaks");

            migrationBuilder.DropTable(
                name: "StreakRequests");
        }
    }
}
