using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class User
{
    public int UserId { get; set; }

    public string? FullName { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string? Phone { get; set; }

    public string? Avatar { get; set; }

    public string? Address { get; set; }

    public int Status { get; set; }

    public int RoleId { get; set; }

    public DateTime? LastLogin { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<BlogPost> BlogPosts { get; set; } = new List<BlogPost>();

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual Role Role { get; set; } = null!;

    public virtual ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();

    public virtual ICollection<WarrantyTicket> WarrantyTicketStaffHandledByNavigations { get; set; } = new List<WarrantyTicket>();

    public virtual ICollection<WarrantyTicket> WarrantyTicketUsers { get; set; } = new List<WarrantyTicket>();

    public virtual ICollection<Wishlist> Wishlists { get; set; } = new List<Wishlist>();
}
