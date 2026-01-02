using System.ComponentModel.DataAnnotations;
namespace api2.Models;

public class BrandUpdateDto
{
    [Required]
    public string BrandName { get; set; } = null!;
    public string? Country { get; set; }
    public string? Description { get; set; }
}