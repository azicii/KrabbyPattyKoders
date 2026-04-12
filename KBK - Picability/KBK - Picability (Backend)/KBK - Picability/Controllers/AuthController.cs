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

        public AuthController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
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
    }
}