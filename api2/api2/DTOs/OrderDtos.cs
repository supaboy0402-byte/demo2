using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
namespace api2.DTOs;

public class OrderItemCreateDto
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    public decimal UnitPrice { get; set; }
}

public class PaymentCreateDto
{
    [Required]
    public decimal Amount { get; set; }

    [Required]
    public int PaymentMethod { get; set; }

    [Required]
    public int Status { get; set; }

    public string? TransactionRef { get; set; }

    public DateTime? PaidAt { get; set; }
}

public class OrderCreateDto
{
    [Required]
    public string OrderCode { get; set; } = null!;

    public int? UserId { get; set; }

    public int? CouponId { get; set; }

    public string? ShippingAddress { get; set; }

    [Required]
    public int Status { get; set; }

    [Required]
    public int ShippingMethod { get; set; }

    [Required]
    public decimal SubTotal { get; set; }

    [Required]
    public decimal DiscountAmount { get; set; }

    [Required]
    public decimal TotalAmount { get; set; }

    public DateTime? OrderDate { get; set; }

    public DateTime? CreatedAt { get; set; }

    public List<OrderItemCreateDto>? OrderItems { get; set; }

    public List<PaymentCreateDto>? Payments { get; set; }
}

public class OrderUpdateDto
{
    public string? OrderCode { get; set; }
    public int? UserId { get; set; }
    public int? Status { get; set; }
    public int? ShippingMethod { get; set; }
    public string? ShippingAddress { get; set; }
    public decimal? SubTotal { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal? TotalAmount { get; set; }
    public int? CouponId { get; set; }
    public DateTime? OrderDate { get; set; }
    public DateTime? CreatedAt { get; set; }
}