using System.ComponentModel.DataAnnotations;
namespace api2.Models;

public class RoleCreateDto
{
    [Required]
    public string RoleName { get; set; } = null!;
}