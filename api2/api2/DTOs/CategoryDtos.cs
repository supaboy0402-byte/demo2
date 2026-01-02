using System.ComponentModel.DataAnnotations;

namespace api2.DTOs;

public class CategoryCreateDto
{
    [Required]
    public string CategoryName { get; set; } = null!;
    public string? Slug { get; set; }
    public int? ParentCategoryId { get; set; }
    public string? FeaturedImage { get; set; }
    public int? SortOrder { get; set; }
    public string? Description { get; set; }
}

public class CategoryUpdateDto
{
    public string? CategoryName { get; set; }
    public string? Slug { get; set; }
    public int? ParentCategoryId { get; set; }
    public string? FeaturedImage { get; set; }
    public int? SortOrder { get; set; }
    public string? Description { get; set; }
}