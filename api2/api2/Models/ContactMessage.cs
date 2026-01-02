using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class ContactMessage
{
    public int MessageId { get; set; }

    public string Name { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public string? Subject { get; set; }

    public string Message { get; set; } = null!;

    public int Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public int? UserIdSend { get; set; }

    public int? UserIdCheck { get; set; }
}
