using System.ComponentModel.DataAnnotations;
namespace api2.DTOs;

public class StockMovementCreateDto
{
    [Required]
    [MaxLength(10)]
    public string MovementType { get; set; } = null!;

    [MaxLength(50)]
    public string? ReferenceType { get; set; }

    public int? ReferenceId { get; set; }

    [MaxLength(50)]
    public string? ReferenceCode { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public int? CreatedBy { get; set; }
}

public class StockMovementUpdateDto
{
    [MaxLength(10)]
    public string? MovementType { get; set; }

    [MaxLength(50)]
    public string? ReferenceType { get; set; }

    public int? ReferenceId { get; set; }

    [MaxLength(50)]
    public string? ReferenceCode { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public int? CreatedBy { get; set; }
}

public class StockApplyDetailDto
{
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

public class StockMovementApplyDto
{
    [Required]
    [MaxLength(10)]
    public string MovementType { get; set; } = null!;

    [MaxLength(50)]
    public string? ReferenceType { get; set; }

    public int? ReferenceId { get; set; }

    [MaxLength(50)]
    public string? ReferenceCode { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public int? CreatedBy { get; set; }

    [Required]
    public List<StockApplyDetailDto> Details { get; set; } = new();
}
