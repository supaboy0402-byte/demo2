using System.ComponentModel.DataAnnotations;
namespace api2.DTOs;

public class ProductImageCreateDto
{
    [Required]
    public int ProductId { get; set; }
    [Required]
    public string ImageUrl { get; set; } = null!;
    public string? AltText { get; set; }
    public bool? IsMain { get; set; }
    public int? SortOrder { get; set; }
}

public class ProductImageUpdateDto
{
    public int? ProductId { get; set; }
    public string? ImageUrl { get; set; }
    public string? AltText { get; set; }
    public bool? IsMain { get; set; }
    public int? SortOrder { get; set; }
}