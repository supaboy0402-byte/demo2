using System.ComponentModel.DataAnnotations;

namespace api2.DTOs;

public class TagCreateDto
{
    [Required]
    public string TagName { get; set; } = null!;
}

public class TagUpdateDto
{
    [Required]
    public string TagName { get; set; } = null!;
}