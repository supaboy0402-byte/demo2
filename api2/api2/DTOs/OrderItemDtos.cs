using System.ComponentModel.DataAnnotations;
namespace api2.DTOs;

public class OrderItemCreateDirectDto
{
    [Required]
    public int OrderId { get; set; }

    [Required]
    public int ProductId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
}

public class OrderItemUpdateDto
{
    public int? OrderId { get; set; }
    public int? ProductId { get; set; }

    [Range(1, int.MaxValue)]
    public int? Quantity { get; set; }
}