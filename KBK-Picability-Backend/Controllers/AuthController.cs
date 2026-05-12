using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Picability.Models;
using Picability.DTOs;

namespace Picability.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        // 1. We need SignInManager to handle the actual password check
        private readonly SignInManager<ApplicationUser> _signInManager;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager) // 2. Add it to constructor
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

        // LOGIN METHOD
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            // Find the user by the email provided in your LoginDto
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
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
                    email = user.Email
                });
            }

            return Unauthorized(new { message = "Invalid email or password" });
        }
    }
}