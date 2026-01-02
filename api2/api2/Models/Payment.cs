using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class Payment
{
    public int PaymentId { get; set; }

    public int OrderId { get; set; }

    public decimal Amount { get; set; }

    public int PaymentMethod { get; set; }

    public int Status { get; set; }

    public string? TransactionRef { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Order Order { get; set; } = null!;
}
