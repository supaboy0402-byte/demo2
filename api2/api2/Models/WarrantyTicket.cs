using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class WarrantyTicket
{
    public int WarrantyId { get; set; }

    public string WarrantyCode { get; set; } = null!;

    public int OrderId { get; set; }

    public int ProductId { get; set; }

    public int? UserId { get; set; }

    public int? StaffHandledBy { get; set; }

    public string IssueDescription { get; set; } = null!;

    public string? Diagnosis { get; set; }

    public string WarrantyStatus { get; set; } = null!;

    public bool IsUnderWarranty { get; set; }

    public decimal? ExtraCost { get; set; }

    public string? CostNote { get; set; }

    public DateTime? EstimatedReturnDate { get; set; }

    public DateTime? CompletedDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Order Order { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;

    public virtual User? StaffHandledByNavigation { get; set; }

    public virtual User? User { get; set; }
}
