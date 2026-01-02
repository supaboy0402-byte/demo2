using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using api2.Models;

namespace api2.Models;

public partial class MusicStoreDbFinal2Context : DbContext
{
    public MusicStoreDbFinal2Context()
    {
    }

    public MusicStoreDbFinal2Context(DbContextOptions<MusicStoreDbFinal2Context> options)
        : base(options)
    {
    }

    public virtual DbSet<BlogPost> BlogPosts { get; set; }

    public virtual DbSet<Brand> Brands { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<ContactMessage> ContactMessages { get; set; }

    public virtual DbSet<Coupon> Coupons { get; set; }

    public virtual DbSet<Event> Events { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductImage> ProductImages { get; set; }

    public virtual DbSet<ProductSpecification> ProductSpecifications { get; set; }

    public virtual DbSet<ProductTagMapping> ProductTagMappings { get; set; }

    public virtual DbSet<Promotion> Promotions { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Setting> Settings { get; set; }

    public virtual DbSet<StockDetail> StockDetails { get; set; }

    public virtual DbSet<StockMovement> StockMovements { get; set; }

    public virtual DbSet<Tag> Tags { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<WarrantyTicket> WarrantyTickets { get; set; }

    public virtual DbSet<Wishlist> Wishlists { get; set; }

//    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
//#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
//        => optionsBuilder.UseSqlServer("Server=LAPTOP-OHIPC0S7\\SQLEXPRESS;Database=MusicStoreDB_Final2;Trusted_Connection=True;TrustServerCertificate=true");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BlogPost>(entity =>
        {
            entity.HasKey(e => e.BlogId).HasName("PK__BlogPost__54379E508EA2BA4C");

            entity.ToTable("BlogPosts", "store");

            entity.HasIndex(e => e.Slug, "UQ__BlogPost__BC7B5FB6A18CEE85").IsUnique();

            entity.Property(e => e.BlogId).HasColumnName("BlogID");
            entity.Property(e => e.AuthorId).HasColumnName("AuthorID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.FeaturedImage).HasMaxLength(500);
            entity.Property(e => e.MetaDescription).HasMaxLength(500);
            entity.Property(e => e.Slug).HasMaxLength(300);
            entity.Property(e => e.Title).HasMaxLength(250);

            entity.HasOne(d => d.Author).WithMany(p => p.BlogPosts)
                .HasForeignKey(d => d.AuthorId)
                .HasConstraintName("FK_BlogPosts_Author");
        });

        modelBuilder.Entity<Brand>(entity =>
        {
            entity.HasKey(e => e.BrandId).HasName("PK__Brands__DAD4F3BE2447ED9C");

            entity.ToTable("Brands", "store");

            entity.HasIndex(e => e.BrandName, "UQ__Brands__2206CE9BD72EF338").IsUnique();

            entity.Property(e => e.BrandId).HasColumnName("BrandID");
            entity.Property(e => e.BrandName).HasMaxLength(150);
            entity.Property(e => e.Country).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId).HasName("PK__Categori__19093A2B160A3B7C");

            entity.ToTable("Categories", "store");

            entity.HasIndex(e => e.CategoryName, "UQ__Categori__8517B2E0DEEA747C").IsUnique();

            entity.Property(e => e.CategoryId).HasColumnName("CategoryID");
            entity.Property(e => e.CategoryName).HasMaxLength(150);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.FeaturedImage).HasMaxLength(500);
            entity.Property(e => e.ParentCategoryId).HasColumnName("ParentCategoryID");
            entity.Property(e => e.Slug).HasMaxLength(200);
            entity.Property(e => e.SortOrder).HasDefaultValue(0);

            entity.HasOne(d => d.ParentCategory).WithMany(p => p.InverseParentCategory)
                .HasForeignKey(d => d.ParentCategoryId)
                .HasConstraintName("FK_Categories_Parent");
        });

        modelBuilder.Entity<ContactMessage>(entity =>
        {
            entity.HasKey(e => e.MessageId).HasName("PK__ContactM__C87C037C31E7AF1E");

            entity.ToTable("ContactMessages", "store");

            entity.Property(e => e.MessageId).HasColumnName("MessageID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.Name).HasMaxLength(150);
            entity.Property(e => e.Phone).HasMaxLength(30);
            entity.Property(e => e.Subject).HasMaxLength(250);
        });

        modelBuilder.Entity<Coupon>(entity =>
        {
            entity.HasKey(e => e.CouponId).HasName("PK__Coupons__384AF1DACF1B786C");

            entity.ToTable("Coupons", "store");

            entity.HasIndex(e => e.Code, "UQ__Coupons__A25C5AA7190E9BB8").IsUnique();

            entity.Property(e => e.CouponId).HasColumnName("CouponID");
            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.DiscountType).HasMaxLength(10);
            entity.Property(e => e.DiscountValue).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasKey(e => e.EventId).HasName("PK__Events__7944C8707F7FE1D2");

            entity.ToTable("Events", "store");

            entity.HasIndex(e => e.Slug, "UQ__Events__BC7B5FB6B3C5C8BF").IsUnique();

            entity.Property(e => e.EventId).HasColumnName("EventID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.FeaturedImage).HasMaxLength(500);
            entity.Property(e => e.Location).HasMaxLength(300);
            entity.Property(e => e.Slug).HasMaxLength(300);
            entity.Property(e => e.Title).HasMaxLength(250);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.OrderId).HasName("PK__Orders__C3905BAF20A94C38");

            entity.ToTable("Orders", "store");

            entity.HasIndex(e => e.UserId, "IDX_Orders_User");

            entity.HasIndex(e => e.OrderCode, "UQ__Orders__999B522957EEADFA").IsUnique();

            entity.Property(e => e.OrderId).HasColumnName("OrderID");
            entity.Property(e => e.CouponId).HasColumnName("CouponID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.OrderCode).HasMaxLength(50);
            entity.Property(e => e.OrderDate).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.ShippingAddress).HasMaxLength(500);
            entity.Property(e => e.ShippingMethod).HasDefaultValue(1);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Coupon).WithMany(p => p.Orders)
                .HasForeignKey(d => d.CouponId)
                .HasConstraintName("FK_Orders_Coupon");

            entity.HasOne(d => d.User).WithMany(p => p.Orders)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Orders_User");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.OrderItemId).HasName("PK__OrderIte__57ED06A13CA9BE49");

            entity.ToTable("OrderItems", "store");

            entity.Property(e => e.OrderItemId).HasColumnName("OrderItemID");
            entity.Property(e => e.LineTotal)
                .HasComputedColumnSql("([Quantity]*[UnitPrice])", true)
                .HasColumnType("decimal(29, 2)");
            entity.Property(e => e.OrderId).HasColumnName("OrderID");
            entity.Property(e => e.ProductId).HasColumnName("ProductID");
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderItems_Order");

            entity.HasOne(d => d.Product).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderItems_Product");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("PK__Payments__9B556A5844D96ED2");

            entity.ToTable("Payments", "store");

            entity.Property(e => e.PaymentId).HasColumnName("PaymentID");
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.OrderId).HasColumnName("OrderID");
            entity.Property(e => e.TransactionRef).HasMaxLength(200);

            entity.HasOne(d => d.Order).WithMany(p => p.Payments)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payments_Order");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductId).HasName("PK__Products__B40CC6EDD178C1AE");

            entity.ToTable("Products", "store");

            entity.HasIndex(e => e.ProductName, "IDX_Products_Name");

            entity.HasIndex(e => e.Sku, "UQ_Products_SKU")
                .IsUnique()
                .HasFilter("([SKU] IS NOT NULL)");

            entity.HasIndex(e => e.Slug, "UQ_Products_Slug")
                .IsUnique()
                .HasFilter("([Slug] IS NOT NULL)");

            entity.HasIndex(e => e.Slug, "UQ__Products__BC7B5FB613A43E6B").IsUnique();

            entity.HasIndex(e => e.Sku, "UQ__Products__CA1ECF0D0F953A18").IsUnique();

            entity.Property(e => e.ProductId).HasColumnName("ProductID");
            entity.Property(e => e.BrandId).HasColumnName("BrandID");
            entity.Property(e => e.CategoryId).HasColumnName("CategoryID");
            entity.Property(e => e.CostPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.DiscountPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MetaDescription).HasMaxLength(500);
            entity.Property(e => e.ProductName).HasMaxLength(200);
            entity.Property(e => e.Sku)
                .HasMaxLength(100)
                .HasColumnName("SKU");
            entity.Property(e => e.Slug).HasMaxLength(200);
            entity.Property(e => e.Status).HasDefaultValue(1);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Brand).WithMany(p => p.Products)
                .HasForeignKey(d => d.BrandId)
                .HasConstraintName("FK_Products_Brand");

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("FK_Products_Category");
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.ImageId).HasName("PK__ProductI__7516F4EC6F9CF799");

            entity.ToTable("ProductImages", "store");

            entity.Property(e => e.ImageId).HasColumnName("ImageID");
            entity.Property(e => e.AltText).HasMaxLength(250);
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.ProductId).HasColumnName("ProductID");

            entity.HasOne(d => d.Product).WithMany(p => p.ProductImages)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ProductImages_Product");
        });

        modelBuilder.Entity<ProductSpecification>(entity =>
        {
            entity.HasKey(e => e.SpecId).HasName("PK__ProductS__883D519B192DB3A1");

            entity.ToTable("ProductSpecifications", "store");

            entity.Property(e => e.SpecId).HasColumnName("SpecID");
            entity.Property(e => e.ProductId).HasColumnName("ProductID");
            entity.Property(e => e.SpecName).HasMaxLength(200);
            entity.Property(e => e.SpecValue).HasMaxLength(500);

            entity.HasOne(d => d.Product).WithMany(p => p.ProductSpecifications)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ProductSpecifications_Product");
        });

        modelBuilder.Entity<ProductTagMapping>(entity =>
        {
            entity.HasKey(e => e.ProductTagId).HasName("PK__ProductT__88A7F36A029C2001");

            entity.ToTable("ProductTagMapping", "store");

            entity.HasIndex(e => new { e.ProductId, e.TagId }, "UX_ProductTag_Product_Tag").IsUnique();

            entity.Property(e => e.ProductTagId).HasColumnName("ProductTagID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.ProductId).HasColumnName("ProductID");
            entity.Property(e => e.TagId).HasColumnName("TagID");

            entity.HasOne(d => d.Product).WithMany(p => p.ProductTagMappings)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PTM_Product");

            entity.HasOne(d => d.Tag).WithMany(p => p.ProductTagMappings)
                .HasForeignKey(d => d.TagId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PTM_Tag");
        });

        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.HasKey(e => e.PromotionId).HasName("PK__Promotio__52C42F2FF51250A6");

            entity.ToTable("Promotions", "store");

            entity.HasIndex(e => e.Slug, "UQ_Promotions_Slug").IsUnique();

            entity.Property(e => e.PromotionId).HasColumnName("PromotionID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.FeaturedImage).HasMaxLength(500);
            entity.Property(e => e.Slug).HasMaxLength(300);
            entity.Property(e => e.Title).HasMaxLength(250);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.ReviewId).HasName("PK__Reviews__74BC79AE5F5121E8");

            entity.ToTable("Reviews", "store");

            entity.Property(e => e.ReviewId).HasColumnName("ReviewID");
            entity.Property(e => e.Comment).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.ProductId).HasColumnName("ProductID");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Product).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reviews_Product");

            entity.HasOne(d => d.User).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reviews_User");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__Roles__8AFACE3A861D85DD");

            entity.ToTable("Roles", "store");

            entity.Property(e => e.RoleId).HasColumnName("RoleID");
            entity.Property(e => e.RoleName).HasMaxLength(50);
        });

        modelBuilder.Entity<Setting>(entity =>
        {
            entity.HasKey(e => e.SettingId).HasName("PK__Settings__54372AFDDA4C9E8D");

            entity.ToTable("Settings", "store");

            entity.HasIndex(e => e.SettingKey, "UQ__Settings__01E719ADFFF4F904").IsUnique();

            entity.Property(e => e.SettingId).HasColumnName("SettingID");
            entity.Property(e => e.SettingGroup).HasMaxLength(100);
            entity.Property(e => e.SettingKey).HasMaxLength(200);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysdatetime())");
        });

        modelBuilder.Entity<StockDetail>(entity =>
        {
            entity.HasKey(e => e.StockDetailId).HasName("PK__StockDet__B04C17361BFB4C43");

            entity.ToTable("StockDetails", "store");

            entity.HasIndex(e => e.ProductId, "IDX_StockDetails_Product");

            entity.Property(e => e.StockDetailId).HasColumnName("StockDetailID");
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.ProductId).HasColumnName("ProductID");
            entity.Property(e => e.StockMovementId).HasColumnName("StockMovementID");
            entity.Property(e => e.UnitCost).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Product).WithMany(p => p.StockDetails)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StockDetails_Product");

            entity.HasOne(d => d.StockMovement).WithMany(p => p.StockDetails)
                .HasForeignKey(d => d.StockMovementId)
                .HasConstraintName("FK_StockDetails_Movement");
        });

        modelBuilder.Entity<StockMovement>(entity =>
        {
            entity.HasKey(e => e.StockMovementId).HasName("PK__StockMov__E963E35CE421D0F9");

            entity.ToTable("StockMovements", "store");

            entity.HasIndex(e => e.CreatedAt, "IDX_StockMovements_CreatedAt");

            entity.HasIndex(e => new { e.ReferenceType, e.ReferenceId }, "IDX_StockMovements_Ref");

            entity.Property(e => e.StockMovementId).HasColumnName("StockMovementID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.MovementType).HasMaxLength(10);
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.ReferenceCode).HasMaxLength(50);
            entity.Property(e => e.ReferenceId).HasColumnName("ReferenceID");
            entity.Property(e => e.ReferenceType).HasMaxLength(50);

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.StockMovements)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_SM_User");
        });

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.TagId).HasName("PK__Tags__657CFA4C91A0A78B");

            entity.ToTable("Tags", "store");

            entity.HasIndex(e => e.TagName, "UQ__Tags__BDE0FD1DC0E267E7").IsUnique();

            entity.Property(e => e.TagId).HasColumnName("TagID");
            entity.Property(e => e.TagName).HasMaxLength(100);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CCACFE25BFF1");

            entity.ToTable("Users", "store");

            entity.HasIndex(e => e.Email, "UQ__Users__A9D10534C43CC6A2").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.Avatar).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.FullName).HasMaxLength(150);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.Phone).HasMaxLength(30);
            entity.Property(e => e.RoleId)
                .HasDefaultValue(2)
                .HasColumnName("RoleID");
            entity.Property(e => e.Status).HasDefaultValue(1);

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Users_Roles");
        });

        modelBuilder.Entity<WarrantyTicket>(entity =>
        {
            entity.HasKey(e => e.WarrantyId).HasName("PK__Warranty__2ED318F3888C2133");

            entity.ToTable("WarrantyTickets", "store");

            entity.HasIndex(e => e.WarrantyCode, "UQ__Warranty__551FF6B2F9A63685").IsUnique();

            entity.Property(e => e.WarrantyId).HasColumnName("WarrantyID");
            entity.Property(e => e.CostNote).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.ExtraCost)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)");
            entity.Property(e => e.IsUnderWarranty).HasDefaultValue(true);
            entity.Property(e => e.OrderId).HasColumnName("OrderID");
            entity.Property(e => e.ProductId).HasColumnName("ProductID");
            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.WarrantyCode).HasMaxLength(50);
            entity.Property(e => e.WarrantyStatus)
                .HasMaxLength(50)
                .HasDefaultValue("Pending");

            entity.HasOne(d => d.Order).WithMany(p => p.WarrantyTickets)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Warranty_Order");

            entity.HasOne(d => d.Product).WithMany(p => p.WarrantyTickets)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Warranty_Product");

            entity.HasOne(d => d.StaffHandledByNavigation).WithMany(p => p.WarrantyTicketStaffHandledByNavigations)
                .HasForeignKey(d => d.StaffHandledBy)
                .HasConstraintName("FK_Warranty_Staff");

            entity.HasOne(d => d.User).WithMany(p => p.WarrantyTicketUsers)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Warranty_User");
        });

        modelBuilder.Entity<Wishlist>(entity =>
        {
            entity.HasKey(e => e.WishlistId).HasName("PK__Wishlist__233189CB8792CC69");

            entity.ToTable("Wishlist", "store");

            entity.HasIndex(e => new { e.UserId, e.ProductId }, "UX_Wishlist_User_Product").IsUnique();

            entity.Property(e => e.WishlistId).HasColumnName("WishlistID");
            entity.Property(e => e.AddedDate).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.ProductId).HasColumnName("ProductID");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Product).WithMany(p => p.Wishlists)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Wishlist_Product");

            entity.HasOne(d => d.User).WithMany(p => p.Wishlists)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Wishlist_User");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);

public DbSet<api2.Models.Brand> Brand { get; set; } = default!;
}
