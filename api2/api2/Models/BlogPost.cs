using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class BlogPost
{
    public int BlogId { get; set; }

    public string Title { get; set; } = null!;

    public string? Slug { get; set; }

    public string Content { get; set; } = null!;

    public string? FeaturedImage { get; set; }

    public int? AuthorId { get; set; }

    public DateTime? PublishedDate { get; set; }

    public int Status { get; set; }

    public string? MetaDescription { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User? Author { get; set; }
}
