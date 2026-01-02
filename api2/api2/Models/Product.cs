using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class Product
{
    public int ProductId { get; set; }

    public string ProductName { get; set; } = null!;

    public string? Slug { get; set; }

    public string? Sku { get; set; }

    public int? CategoryId { get; set; }

    public int? BrandId { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal? CostPrice { get; set; }

    public decimal? DiscountPrice { get; set; }

    public int Quantity { get; set; }

    public bool IsFeatured { get; set; }

    public int Status { get; set; }

    public string? MetaDescription { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Brand? Brand { get; set; }

    public virtual Category? Category { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();

    public virtual ICollection<ProductSpecification> ProductSpecifications { get; set; } = new List<ProductSpecification>();

    public virtual ICollection<ProductTagMapping> ProductTagMappings { get; set; } = new List<ProductTagMapping>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<StockDetail> StockDetails { get; set; } = new List<StockDetail>();

    public virtual ICollection<WarrantyTicket> WarrantyTickets { get; set; } = new List<WarrantyTicket>();

    public virtual ICollection<Wishlist> Wishlists { get; set; } = new List<Wishlist>();
}
