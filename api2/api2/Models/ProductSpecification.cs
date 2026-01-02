using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class ProductSpecification
{
    public int SpecId { get; set; }

    public int ProductId { get; set; }

    public string SpecName { get; set; } = null!;

    public string? SpecValue { get; set; }

    public virtual Product Product { get; set; } = null!;
}
