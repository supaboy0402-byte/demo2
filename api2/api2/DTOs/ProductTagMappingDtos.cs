using System.ComponentModel.DataAnnotations;
namespace api2.DTOs;

public class ProductTagMappingCreateDto
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    public int TagId { get; set; }
}

public class ProductTagMappingUpdateDto
{
    public int? ProductId { get; set; }
    public int? TagId { get; set; }
}