using System.ComponentModel.DataAnnotations;
namespace api2.Models;

public class RoleUpdateDto
{
    [Required]
    public string RoleName { get; set; } = null!;
}