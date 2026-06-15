using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Picability.Models;
using Picability.DTOs;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Picability.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        // 1. We need SignInManager to handle the actual password check
        private readonly SignInManager<ApplicationUser> _signInManager;

        private readonly IConfiguration _configuration;

        private string GenerateJwtToken(ApplicationUser user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? ""),
                new Claim(ClaimTypes.Email, user.Email ?? "")
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public AuthController(
                    UserManager<ApplicationUser> userManager,
                    SignInManager<ApplicationUser> signInManager,
                    IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto model)
        {
            var user = new ApplicationUser
            {
                UserName = model.Username,
                Email = model.Email,
                UserNameDisplay = model.Username
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            return Ok(new
            {
                message = "User registered successfully",
                user.Id,
                user.UserName,
                user.Email
            });
        }

        // LOGIN METHOD
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            // The Email field is now being used as "email OR username"
            var loginInput = model.Email?.Trim();

            if (string.IsNullOrWhiteSpace(loginInput))
            {
                return BadRequest(new { message = "Email or username is required" });
            }

            // First try email login
            var user = await _userManager.FindByEmailAsync(loginInput);

            // If no user was found by email, try username login
            if (user == null)
            {
                user = await _userManager.FindByNameAsync(loginInput);
            }

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email/username or password" });
            }

            // Check the password against the hashed version in the DB
            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);

            if (result.Succeeded)
            {
                return Ok(new
                {
                    message = "Login successful",
                    id = user.Id,
                    userName = user.UserName,
                    email = user.Email,
                    token = GenerateJwtToken(user)
                });
            }

            return Unauthorized(new { message = "Invalid email/username or password" });
        }
    }
}