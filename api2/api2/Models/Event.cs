using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class Event
{
    public int EventId { get; set; }

    public string Title { get; set; } = null!;

    public string? Slug { get; set; }

    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public string? Location { get; set; }

    public string? FeaturedImage { get; set; }

    public int Status { get; set; }

    public DateTime CreatedAt { get; set; }
}
