using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class Category
{
    public int CategoryId { get; set; }

    public string CategoryName { get; set; } = null!;

    public string? Slug { get; set; }

    public int? ParentCategoryId { get; set; }

    public string? FeaturedImage { get; set; }

    public int? SortOrder { get; set; }

    public string? Description { get; set; }

    public virtual ICollection<Category> InverseParentCategory { get; set; } = new List<Category>();

    public virtual Category? ParentCategory { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
