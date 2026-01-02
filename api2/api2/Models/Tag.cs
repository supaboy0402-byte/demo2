using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class Tag
{
    public int TagId { get; set; }

    public string TagName { get; set; } = null!;

    public virtual ICollection<ProductTagMapping> ProductTagMappings { get; set; } = new List<ProductTagMapping>();
}
