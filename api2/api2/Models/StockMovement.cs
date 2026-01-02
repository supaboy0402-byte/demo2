using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class StockMovement
{
    public int StockMovementId { get; set; }

    public string MovementType { get; set; } = null!;

    public string? ReferenceType { get; set; }

    public int? ReferenceId { get; set; }

    public string? ReferenceCode { get; set; }

    public string? Note { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ICollection<StockDetail> StockDetails { get; set; } = new List<StockDetail>();
}
