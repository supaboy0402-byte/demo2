using System.ComponentModel.DataAnnotations;
namespace api2.Models;

public class UserCreateDto
{
    public string? FullName { get; set; }
    [Required]
    public string Email { get; set; } = null!;
    [Required]
    public string PasswordHash { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Avatar { get; set; }
    public string? Address { get; set; }
    public int? Status { get; set; }
    public int? RoleId { get; set; }
    public DateTime? LastLogin { get; set; }
}