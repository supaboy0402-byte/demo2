using System.ComponentModel.DataAnnotations;
namespace api2.DTOs;

public class ProductCreateDto
{
    [Required]
    public string ProductName { get; set; } = null!;
    public string? Slug { get; set; }
    public string? Sku { get; set; }
    public int? CategoryId { get; set; }
    public int? BrandId { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? CostPrice { get; set; }
    public decimal? DiscountPrice { get; set; }
    public int Quantity { get; set; }
    public bool IsFeatured { get; set; }
    public int? Status { get; set; }
    public string? MetaDescription { get; set; }
    public string? Description { get; set; }
}

public class ProductUpdateDto
{
    public string? ProductName { get; set; }
    public string? Slug { get; set; }
    public string? Sku { get; set; }
    public int? CategoryId { get; set; }
    public int? BrandId { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal? CostPrice { get; set; }
    public decimal? DiscountPrice { get; set; }
    public int? Quantity { get; set; }
    public bool? IsFeatured { get; set; }
    public int? Status { get; set; }
    public string? MetaDescription { get; set; }
    public string? Description { get; set; }
}