using System.ComponentModel.DataAnnotations;
namespace api2.DTOs;

public class ReviewCreateDto
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }
}

public class ReviewUpdateDto
{
    public int? ProductId { get; set; }
    public int? UserId { get; set; }

    [Range(1, 5)]
    public int? Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }
}