using System;
using System.ComponentModel.DataAnnotations;
namespace api2.DTOs;

public class WarrantyTicketCreateDto
{
    [Required]
    public string WarrantyCode { get; set; } = null!;

    [Required]
    public int OrderId { get; set; }

    [Required]
    public int ProductId { get; set; }

    public int? UserId { get; set; }

    public int? StaffHandledBy { get; set; }

    [Required]
    public string IssueDescription { get; set; } = null!;

    public string? Diagnosis { get; set; }

    public string? WarrantyStatus { get; set; }

    public bool? IsUnderWarranty { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal? ExtraCost { get; set; }

    public string? CostNote { get; set; }

    public DateTime? EstimatedReturnDate { get; set; }

    public DateTime? CompletedDate { get; set; }
}

public class WarrantyTicketUpdateDto
{
    public string? WarrantyCode { get; set; }
    public int? OrderId { get; set; }
    public int? ProductId { get; set; }
    public int? UserId { get; set; }
    public int? StaffHandledBy { get; set; }
    public string? IssueDescription { get; set; }
    public string? Diagnosis { get; set; }
    public string? WarrantyStatus { get; set; }
    public bool? IsUnderWarranty { get; set; }
    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal? ExtraCost { get; set; }
    public string? CostNote { get; set; }
    public DateTime? EstimatedReturnDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime? CreatedAt { get; set; }
}
