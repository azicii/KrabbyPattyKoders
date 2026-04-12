using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Picability.Models;
using Picability.DTOs;

namespace Picability.Controllers
{
    // creates a working registration endpoint
    // basically lets the app create users in the database through backend API instead of having the database structure sitting there unused. 
    // creates endpoint, creates a new ApplicationUser, hash the password securely, save the user into the database
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        // Added SignInManager to handle password verification
        private readonly SignInManager<ApplicationUser> _signInManager;

        // Constructor updated to include SignInManager while keeping UserManager
        public AuthController(
            UserManager<ApplicationUser> userManager, 
            SignInManager<ApplicationUser> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
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

        // New Login Endpoint
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            // Find user by email provided in the LoginDto
            var user = await _userManager.FindByEmailAsync(model.Email);
            
            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Verify password using Identity's built-in CheckPasswordSignInAsync
            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);

            if (result.Succeeded)
            {
                return Ok(new
                {
                    message = "Login successful",
                    id = user.Id,
                    userName = user.UserName,
                    email = user.Email
                });
            }

            return Unauthorized(new { message = "Invalid email or password" });
        }
    }
}