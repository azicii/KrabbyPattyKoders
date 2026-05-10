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
        private readonly SignInManager<ApplicationUser> _signInManager;

        public AuthController(UserManager<ApplicationUser> userManager,
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

        //Added Login logic
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto model)
        {
            // Look up by email since that's what the frontend sends.
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                return Unauthorized(new { message = "Invalid email or password." });

            var result = await _signInManager.CheckPasswordSignInAsync(
                user, model.Password, lockoutOnFailure: false);

            if (!result.Succeeded)
                return Unauthorized(new { message = "Invalid email or password." });

            return Ok(new
            {
                user.Id,
                user.UserName,
                user.Email
            });

        }
    }
}