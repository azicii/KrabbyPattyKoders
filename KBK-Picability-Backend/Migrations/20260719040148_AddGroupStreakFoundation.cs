using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace KBK___Picability.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupStreakFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "Streaks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsGroupStreak",
                table: "Streaks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGroupRequest",
                table: "StreakRequests",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "StreakMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StreakId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    IsCreator = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    VisibilityPublic = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StreakMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StreakMembers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StreakMembers_Streaks_StreakId",
                        column: x => x.StreakId,
                        principalTable: "Streaks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StreakRequestMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StreakRequestId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false, defaultValue: "Pending"),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StreakRequestMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StreakRequestMembers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StreakRequestMembers_StreakRequests_StreakRequestId",
                        column: x => x.StreakRequestId,
                        principalTable: "StreakRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

                        /*
                * Backfill all existing two-person streaks into StreakMembers.
                *
                * UserOne is the creator because the existing acceptance flow
                * creates UserOneId from StreakRequest.SenderId.
                */
                        migrationBuilder.Sql(@"
                INSERT INTO ""StreakMembers""
                    (""StreakId"", ""UserId"", ""IsCreator"", ""VisibilityPublic"", ""JoinedAt"")
                SELECT
                    ""Id"",
                    ""UserOneId"",
                    TRUE,
                    ""UserOneVisibilityPublic"",
                    ""StartedAt""
                FROM ""Streaks"";
            ");

                        migrationBuilder.Sql(@"
                INSERT INTO ""StreakMembers""
                    (""StreakId"", ""UserId"", ""IsCreator"", ""VisibilityPublic"", ""JoinedAt"")
                SELECT
                    ""Id"",
                    ""UserTwoId"",
                    FALSE,
                    ""UserTwoVisibilityPublic"",
                    ""StartedAt""
                FROM ""Streaks"";
            ");

            /*
                * Record the original creator on existing streaks.
                */
            migrationBuilder.Sql(@"
                UPDATE ""Streaks""
                SET ""CreatedByUserId"" = ""UserOneId""
                WHERE ""CreatedByUserId"" IS NULL;
            ");

            /*
             * Backfill the receiver of every existing streak request
             * into the new StreakRequestMembers relationship.
             */
                        migrationBuilder.Sql(@"
                INSERT INTO ""StreakRequestMembers""
                    (""StreakRequestId"", ""UserId"", ""Status"", ""RespondedAt"")
                SELECT
                    ""Id"",
                    ""ReceiverId"",
                    ""Status"",
                    CASE
                        WHEN ""Status"" = 'Pending' THEN NULL
                        ELSE ""CreatedAt""
                    END
                FROM ""StreakRequests"";
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Streaks_CreatedByUserId",
                table: "Streaks",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StreakMembers_StreakId_UserId",
                table: "StreakMembers",
                columns: new[] { "StreakId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StreakMembers_UserId",
                table: "StreakMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_StreakRequestMembers_StreakRequestId_UserId",
                table: "StreakRequestMembers",
                columns: new[] { "StreakRequestId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StreakRequestMembers_UserId",
                table: "StreakRequestMembers",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Streaks_AspNetUsers_CreatedByUserId",
                table: "Streaks",
                column: "CreatedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Streaks_AspNetUsers_CreatedByUserId",
                table: "Streaks");

            migrationBuilder.DropTable(
                name: "StreakMembers");

            migrationBuilder.DropTable(
                name: "StreakRequestMembers");

            migrationBuilder.DropIndex(
                name: "IX_Streaks_CreatedByUserId",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "IsGroupStreak",
                table: "Streaks");

            migrationBuilder.DropColumn(
                name: "IsGroupRequest",
                table: "StreakRequests");
        }
    }
}
