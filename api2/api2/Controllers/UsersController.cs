using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api2.Models;
using api2.Services;

namespace api2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public UsersController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            return user;
        }

        // PUT: api/Users/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, [FromBody] UserUpdateDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var emailConflict = await _context.Users.AnyAsync(u => u.Email == dto.Email && u.UserId != id);
                if (emailConflict)
                {
                    return Conflict("Email already exists");
                }
                user.Email = dto.Email;
            }

            if (!string.IsNullOrWhiteSpace(dto.FullName)) user.FullName = dto.FullName;
            if (!string.IsNullOrWhiteSpace(dto.PasswordHash)) user.PasswordHash = dto.PasswordHash;
            if (!string.IsNullOrWhiteSpace(dto.Phone)) user.Phone = dto.Phone;
            if (!string.IsNullOrWhiteSpace(dto.Avatar)) user.Avatar = dto.Avatar;
            if (!string.IsNullOrWhiteSpace(dto.Address)) user.Address = dto.Address;
            if (dto.Status.HasValue) user.Status = dto.Status.Value;
            if (dto.RoleId.HasValue) user.RoleId = dto.RoleId.Value;
            if (dto.LastLogin.HasValue) user.LastLogin = dto.LastLogin.Value;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Users
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<User>> PostUser([FromBody] UserCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.PasswordHash))
            {
                return BadRequest("Email and PasswordHash are required");
            }

            var exists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (exists)
            {
                return Conflict("Email already exists");
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = dto.PasswordHash,
                Phone = dto.Phone,
                Avatar = dto.Avatar,
                Address = dto.Address,
                Status = dto.Status ?? 1,
                RoleId = dto.RoleId ?? 2,
                LastLogin = dto.LastLogin
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetUser", new { id = user.UserId }, user);
        }

        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UserExists(int id)
        {
            return _context.Users.Any(e => e.UserId == id);
        }

        [HttpPost("{id}/avatar")]
        public async Task<IActionResult> UploadAvatar(int id, IFormFile file)
        {
            var token = Request.Cookies["auth_token"];
            if (string.IsNullOrEmpty(token) || !SimpleToken.TryDecode(token, out var userId) || userId != id)
                return Unauthorized();

            if (file == null || file.Length == 0) return BadRequest("No file");
            if (file.Length > 2 * 1024 * 1024) return BadRequest("File too large");
            var allowed = new[] { "image/jpeg", "image/png" };
            if (!allowed.Contains(file.ContentType)) return BadRequest("Unsupported file type");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext != ".jpg" && ext != ".jpeg" && ext != ".png") return BadRequest("Unsupported extension");

            var wwwroot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var dir = Path.Combine(wwwroot, "avatars");
            Directory.CreateDirectory(dir);
            var name = Guid.NewGuid().ToString("N") + ext;
            var fullPath = Path.Combine(dir, name);
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            user.Avatar = "/avatars/" + name;
            await _context.SaveChangesAsync();

            return Ok(new { avatar = user.Avatar });
        }
    }
}
