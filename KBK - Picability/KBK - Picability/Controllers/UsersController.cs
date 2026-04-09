using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Picability.Data;
using Picability.DTOs;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest("Query is required.");
        }
       
        //query users table LIKE [input string] 
        //returns ID and Username
        var users = await _context.Users
            .Where(u => u.UserName.Contains(query))
            .Select(u => new UserSearchResultDto
            {
                Id = u.Id,
                UserName = u.UserName
            })
            .Take(10) // keep it small and simple
            .ToListAsync();

        return Ok(users);
    }
}