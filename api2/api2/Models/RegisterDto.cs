namespace api2.Models;

public class RegisterDto
{
    public string? FullName { get; set; }
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Avatar { get; set; }
    public string? Address { get; set; }
}
