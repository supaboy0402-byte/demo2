using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class ProductTagMapping
{
    public int ProductTagId { get; set; }

    public int ProductId { get; set; }

    public int TagId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual Tag Tag { get; set; } = null!;
}
