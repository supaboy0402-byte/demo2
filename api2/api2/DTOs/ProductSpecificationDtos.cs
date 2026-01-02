using System.ComponentModel.DataAnnotations;
namespace api2.DTOs;

public class ProductSpecificationCreateDto
{
    [Required]
    public int ProductId { get; set; }
    [Required]
    public string SpecName { get; set; } = null!;
    public string? SpecValue { get; set; }
}

public class ProductSpecificationUpdateDto
{
    public int? ProductId { get; set; }
    public string? SpecName { get; set; }
    public string? SpecValue { get; set; }
}