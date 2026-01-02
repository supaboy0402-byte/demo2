using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class Order
{
    public int OrderId { get; set; }

    public string OrderCode { get; set; } = null!;

    public int? UserId { get; set; }

    public DateTime OrderDate { get; set; }

    public int Status { get; set; }

    public int ShippingMethod { get; set; }

    public string? ShippingAddress { get; set; }

    public decimal SubTotal { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal TotalAmount { get; set; }

    public int? CouponId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Coupon? Coupon { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual User? User { get; set; }

    public virtual ICollection<WarrantyTicket> WarrantyTickets { get; set; } = new List<WarrantyTicket>();
}
