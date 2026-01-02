using System.ComponentModel.DataAnnotations;
namespace api2.Models;

public class UserUpdateDto
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? PasswordHash { get; set; }
    public string? Phone { get; set; }
    public string? Avatar { get; set; }
    public string? Address { get; set; }
    public int? Status { get; set; }
    public int? RoleId { get; set; }
    public DateTime? LastLogin { get; set; }
}
