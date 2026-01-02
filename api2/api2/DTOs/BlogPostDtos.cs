using System;
using System.ComponentModel.DataAnnotations;
namespace api2.DTOs;

public class BlogPostCreateDto
{
    [Required]
    [MaxLength(250)]
    public string Title { get; set; } = null!;

    [MaxLength(300)]
    public string? Slug { get; set; }

    [Required]
    public string Content { get; set; } = null!;

    [MaxLength(500)]
    public string? FeaturedImage { get; set; }

    public int? AuthorId { get; set; }

    public DateTime? PublishedDate { get; set; }

    public int? Status { get; set; }

    [MaxLength(500)]
    public string? MetaDescription { get; set; }
}

public class BlogPostUpdateDto
{
    [MaxLength(250)]
    public string? Title { get; set; }

    [MaxLength(300)]
    public string? Slug { get; set; }

    public string? Content { get; set; }

    [MaxLength(500)]
    public string? FeaturedImage { get; set; }

    public int? AuthorId { get; set; }

    public DateTime? PublishedDate { get; set; }

    public int? Status { get; set; }

    [MaxLength(500)]
    public string? MetaDescription { get; set; }
}