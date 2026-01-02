using Microsoft.AspNetCore.Mvc;
using api2.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using api2.Services;
using System.Net.Mail;
using System.Net;

namespace api2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;
        private readonly IConfiguration _config;

        public AuthController(MusicStoreDbFinal2Context context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public class ForgotPasswordDto
        {
            public string Email { get; set; } = null!;
        }

        public class ResetPasswordDto
        {
            public string Token { get; set; } = null!;
            public string NewPassword { get; set; } = null!;
        }

        public class ResetPasswordOtpDto
        {
            public string Email { get; set; } = null!;
            public string Otp { get; set; } = null!;
            public string NewPassword { get; set; } = null!;
        }

        private async Task<bool> SendOtpEmailAsync(string toEmail, string otp)
        {
            var host = _config["Smtp:Host"] ?? "";
            var portStr = _config["Smtp:Port"] ?? "587";
            var user = _config["Smtp:Username"] ?? "";
            var pass = _config["Smtp:Password"] ?? "";
            var from = _config["Smtp:From"] ?? user;
            var enableSsl = string.Equals((_config["Smtp:EnableSsl"] ?? "true"), "true", StringComparison.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
                return false;
            var port = 587;
            int.TryParse(portStr, out port);
            using var smtp = new SmtpClient(host, port);
            smtp.EnableSsl = enableSsl;
            if (!string.IsNullOrWhiteSpace(user) && !string.IsNullOrWhiteSpace(pass))
                smtp.Credentials = new NetworkCredential(user, pass);
            var mail = new MailMessage();
            mail.From = new MailAddress(from, "Harmony Music Store");
            mail.To.Add(toEmail);
            mail.Subject = "Mã OTP đặt lại mật khẩu";
            mail.Body = $"Mã OTP của bạn là: <b>{WebUtility.HtmlEncode(otp)}</b>. Mã có hiệu lực trong 15 phút.";
            mail.IsBodyHtml = true;
            await smtp.SendMailAsync(mail);
            return true;
        }

        private async Task<bool> SendVerificationEmailAsync(string toEmail, int userId, string token)
        {
            var host = _config["Smtp:Host"] ?? "";
            var portStr = _config["Smtp:Port"] ?? "587";
            var user = _config["Smtp:Username"] ?? "";
            var pass = _config["Smtp:Password"] ?? "";
            var from = _config["Smtp:From"] ?? user;
            var enableSsl = string.Equals((_config["Smtp:EnableSsl"] ?? "true"), "true", StringComparison.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
                return false;
            var port = 587;
            int.TryParse(portStr, out port);
            using var smtp = new SmtpClient(host, port);
            smtp.EnableSsl = enableSsl;
            if (!string.IsNullOrWhiteSpace(user) && !string.IsNullOrWhiteSpace(pass))
                smtp.Credentials = new NetworkCredential(user, pass);

            var backendBase = _config["Backend:BaseUrl"] ?? "http://localhost:5077";
            var verifyUrl = $"{backendBase}/api/Auth/verify-email?token={WebUtility.UrlEncode(token)}";

            var mail = new MailMessage();
            mail.From = new MailAddress(from, "Harmony Music Store");
            mail.To.Add(toEmail);
            mail.Subject = "Xác thực tài khoản Harmony Music Store";
            mail.Body = $"Chào mừng! Vui lòng nhấn vào liên kết sau để xác thực email của bạn:<br/><a href=\"{verifyUrl}\">{verifyUrl}</a><br/>Liên kết có hiệu lực trong 48 giờ.";
            mail.IsBodyHtml = true;
            await smtp.SendMailAsync(mail);
            return true;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Email and password are required");

            var exists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (exists) return Conflict("Email already exists");

            using var sha = SHA256.Create();
            var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(dto.Password));
            var hashHex = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = hashHex,
                Phone = dto.Phone,
                Avatar = dto.Avatar,
                Address = dto.Address,
                Status = 1,
                RoleId = 2
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            try
            {
                var expires = DateTime.UtcNow.AddHours(48);
                var token = SimpleToken.Encode(user.UserId, expires);
                var key = $"email_verify_token:{user.UserId}";
                var setting = await _context.Settings.FirstOrDefaultAsync(s => s.SettingKey == key);
                if (setting == null)
                {
                    setting = new Setting { SettingKey = key, SettingGroup = "auth", SettingValue = token, UpdatedAt = DateTime.UtcNow };
                    _context.Settings.Add(setting);
                }
                else
                {
                    setting.SettingValue = token;
                    setting.UpdatedAt = DateTime.UtcNow;
                }
                await _context.SaveChangesAsync();
                await SendVerificationEmailAsync(dto.Email, user.UserId, token);
            }
            catch { }
            return Ok(new { userId = user.UserId });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Email and password are required");

            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
                return Unauthorized("Invalid credentials");

            using var sha = SHA256.Create();
            var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(dto.Password));
            var hashHex = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
            var ok = string.Equals(user.PasswordHash, hashHex, StringComparison.OrdinalIgnoreCase);
            if (!ok)
                return Unauthorized("Invalid credentials");

            var token = SimpleToken.Encode(user.UserId, DateTime.UtcNow.AddDays(7));

            var isHttps = Request.IsHttps;
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = isHttps,
                SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
                Path = "/",
            };
            if (dto.RememberMe)
            {
                cookieOptions.Expires = DateTimeOffset.UtcNow.AddDays(7);
            }
            Response.Cookies.Delete("auth_token", new CookieOptions { Path = "/", Secure = isHttps, SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax });
            Response.Cookies.Append("auth_token", token, cookieOptions);

            var rn = (user.Role?.RoleName ?? string.Empty).Trim().ToLowerInvariant();
            var roleCode = (rn.Contains("admin") || rn.Contains("quản trị viên")) ? "admin" : (rn.Contains("staff") || rn.Contains("nhân viên") ? "staff" : "customer");
            return Ok(new
            {
                userId = user.UserId,
                fullName = user.FullName,
                email = user.Email,
                roleId = user.RoleId,
                roleName = user.Role?.RoleName,
                roleCode
            });
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var token = Request.Cookies["auth_token"];
            if (string.IsNullOrEmpty(token))
                return Unauthorized();

            if (!SimpleToken.TryDecode(token, out var userId))
                return Unauthorized();

            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                return Unauthorized();

            var rn = (user.Role?.RoleName ?? string.Empty).Trim().ToLowerInvariant();
            var roleCode = (rn.Contains("admin") || rn.Contains("quản trị viên")) ? "admin" : (rn.Contains("staff") || rn.Contains("nhân viên") ? "staff" : "customer");
            return Ok(new
            {
                userId = user.UserId,
                fullName = user.FullName,
                email = user.Email,
                roleId = user.RoleId,
                roleName = user.Role?.RoleName,
                roleCode
            });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            var isHttps = Request.IsHttps;
            Response.Cookies.Delete("auth_token", new CookieOptions { Path = "/", Secure = isHttps, SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax });
            return Ok(new { ok = true });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
                return BadRequest("CurrentPassword and NewPassword are required");

            var token = Request.Cookies["auth_token"];
            if (string.IsNullOrEmpty(token) || !SimpleToken.TryDecode(token, out var userId))
                return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null) return Unauthorized();

            using var sha = SHA256.Create();
            var curHash = sha.ComputeHash(Encoding.UTF8.GetBytes(dto.CurrentPassword));
            var curHex = BitConverter.ToString(curHash).Replace("-", "").ToLowerInvariant();
            if (!string.Equals(user.PasswordHash, curHex, StringComparison.OrdinalIgnoreCase))
                return Unauthorized("Invalid current password");

            if (dto.NewPassword.Length < 8)
                return BadRequest("Password must be at least 8 characters");

            var newHash = sha.ComputeHash(Encoding.UTF8.GetBytes(dto.NewPassword));
            var newHex = BitConverter.ToString(newHash).Replace("-", "").ToLowerInvariant();
            user.PasswordHash = newHex;
            await _context.SaveChangesAsync();
            return Ok(new { ok = true });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var email = (dto?.Email ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(email))
                return Ok(new { ok = true });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return Ok(new { ok = true });

            var code = RandomNumberGenerator.GetInt32(0, 1000000).ToString("D6");
            var exp = DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds();
            var key = $"password_reset_otp:{user.UserId}";
            var setting = await _context.Settings.FirstOrDefaultAsync(s => s.SettingKey == key);
            if (setting == null)
            {
                setting = new Setting { SettingKey = key, SettingGroup = "auth", SettingValue = $"{code}|{exp}", UpdatedAt = DateTime.UtcNow };
                _context.Settings.Add(setting);
            }
            else
            {
                setting.SettingValue = $"{code}|{exp}";
                setting.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
            try
            {
                await SendOtpEmailAsync(email, code);
            }
            catch
            {
            }
            return Ok(new { ok = true });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var token = dto?.Token ?? string.Empty;
            var newPassword = dto?.NewPassword ?? string.Empty;
            if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(newPassword))
                return BadRequest("Token and NewPassword are required");
            if (newPassword.Length < 8)
                return BadRequest("Password must be at least 8 characters");
            if (!SimpleToken.TryDecode(token, out var userId))
                return BadRequest("Invalid or expired token");

            var key = $"password_reset_token:{userId}";
            var setting = await _context.Settings.FirstOrDefaultAsync(s => s.SettingKey == key);
            if (setting == null || !string.Equals(setting.SettingValue ?? string.Empty, token, StringComparison.Ordinal))
                return Unauthorized("Invalid reset token");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                return NotFound();

            using var sha = SHA256.Create();
            var newHash = sha.ComputeHash(Encoding.UTF8.GetBytes(newPassword));
            var newHex = BitConverter.ToString(newHash).Replace("-", "").ToLowerInvariant();
            user.PasswordHash = newHex;
            _context.Settings.Remove(setting);
            await _context.SaveChangesAsync();
            return Ok(new { ok = true });
        }

        [HttpPost("reset-password-otp")]
        public async Task<IActionResult> ResetPasswordOtp([FromBody] ResetPasswordOtpDto dto)
        {
            var email = (dto?.Email ?? string.Empty).Trim();
            var otp = (dto?.Otp ?? string.Empty).Trim();
            var newPassword = dto?.NewPassword ?? string.Empty;
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(otp) || string.IsNullOrWhiteSpace(newPassword))
                return BadRequest("Email, Otp and NewPassword are required");
            if (newPassword.Length < 8)
                return BadRequest("Password must be at least 8 characters");
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return Unauthorized();
            var key = $"password_reset_otp:{user.UserId}";
            var setting = await _context.Settings.FirstOrDefaultAsync(s => s.SettingKey == key);
            if (setting == null || string.IsNullOrEmpty(setting.SettingValue))
                return Unauthorized("Invalid or expired OTP");
            var parts = (setting.SettingValue ?? "").Split('|');
            if (parts.Length != 2)
                return Unauthorized("Invalid or expired OTP");
            var code = parts[0];
            var expUnix = long.TryParse(parts[1], out var expVal) ? expVal : 0;
            var expUtc = DateTimeOffset.FromUnixTimeSeconds(expUnix).UtcDateTime;
            if (!string.Equals(code, otp, StringComparison.Ordinal))
                return Unauthorized("Invalid or expired OTP");
            if (DateTime.UtcNow > expUtc)
                return Unauthorized("Invalid or expired OTP");
            using var sha = SHA256.Create();
            var newHash = sha.ComputeHash(Encoding.UTF8.GetBytes(newPassword));
            var newHex = BitConverter.ToString(newHash).Replace("-", "").ToLowerInvariant();
            user.PasswordHash = newHex;
            _context.Settings.Remove(setting);
            await _context.SaveChangesAsync();
            return Ok(new { ok = true });
        }

        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return BadRequest("Missing token");
            if (!SimpleToken.TryDecode(token, out var userId))
                return BadRequest("Invalid or expired token");
            var key = $"email_verify_token:{userId}";
            var setting = await _context.Settings.FirstOrDefaultAsync(s => s.SettingKey == key);
            if (setting == null || !string.Equals(setting.SettingValue ?? string.Empty, token, StringComparison.Ordinal))
                return Unauthorized("Invalid token");
            _context.Settings.Remove(setting);
            var verifiedKey = $"email_verified:{userId}";
            var verifiedSetting = await _context.Settings.FirstOrDefaultAsync(s => s.SettingKey == verifiedKey);
            if (verifiedSetting == null)
            {
                _context.Settings.Add(new Setting { SettingKey = verifiedKey, SettingGroup = "auth", SettingValue = "true", UpdatedAt = DateTime.UtcNow });
            }
            else
            {
                verifiedSetting.SettingValue = "true";
                verifiedSetting.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
            var frontendBase = _config["Frontend:BaseUrl"] ?? "http://localhost:3000";
            return Redirect($"{frontendBase}/login?emailVerified=1");
        }
    }
}
