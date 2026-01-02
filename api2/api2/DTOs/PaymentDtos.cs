using System;
using System.ComponentModel.DataAnnotations;
namespace api2.DTOs;

public class PaymentCreateDirectDto
{
    [Required]
    public int OrderId { get; set; }

    [Required]
    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
    public decimal Amount { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int PaymentMethod { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int Status { get; set; }

    public string? TransactionRef { get; set; }

    public DateTime? PaidAt { get; set; }
}

public class PaymentUpdateDto
{
    public int? OrderId { get; set; }

    [Range(typeof(decimal), "0.0", "79228162514264337593543950335")]
    public decimal? Amount { get; set; }

    [Range(1, int.MaxValue)]
    public int? PaymentMethod { get; set; }

    [Range(0, int.MaxValue)]
    public int? Status { get; set; }

    public string? TransactionRef { get; set; }

    public DateTime? PaidAt { get; set; }
}