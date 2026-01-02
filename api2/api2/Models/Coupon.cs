using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class Coupon
{
    public int CouponId { get; set; }

    public string Code { get; set; } = null!;

    public string DiscountType { get; set; } = null!;

    public decimal DiscountValue { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool IsActive { get; set; }

    public int? Quantity { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
