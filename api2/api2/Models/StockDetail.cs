using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class StockDetail
{
    public int StockDetailId { get; set; }

    public int StockMovementId { get; set; }

    public int ProductId { get; set; }

    public int Quantity { get; set; }

    public decimal? UnitCost { get; set; }

    public string? Note { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual StockMovement StockMovement { get; set; } = null!;
}
