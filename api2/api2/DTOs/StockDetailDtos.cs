using System.ComponentModel.DataAnnotations;
namespace api2.DTOs;

public class StockDetailCreateDto
{
    [Required]
    [Range(1, int.MaxValue)]
    public int StockMovementId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int ProductId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal? UnitCost { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }
}

public class StockDetailUpdateDto
{
    [Required]
    [Range(1, int.MaxValue)]
    public int StockMovementId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int ProductId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal? UnitCost { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }
}
