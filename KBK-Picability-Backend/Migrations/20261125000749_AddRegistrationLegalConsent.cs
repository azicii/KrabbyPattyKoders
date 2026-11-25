using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KBK___Picability.Migrations
{
    /// <inheritdoc />
    public partial class AddRegistrationLegalConsent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AcceptedTermsVersion",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TermsAcceptedAtUtc",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcceptedTermsVersion",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "TermsAcceptedAtUtc",
                table: "AspNetUsers");
        }
    }
}
