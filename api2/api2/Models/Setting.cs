using System;
using System.Collections.Generic;

namespace api2.Models;

public partial class Setting
{
    public int SettingId { get; set; }

    public string SettingKey { get; set; } = null!;

    public string? SettingValue { get; set; }

    public string? SettingGroup { get; set; }

    public DateTime UpdatedAt { get; set; }
}
