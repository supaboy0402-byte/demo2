using System;
using System.ComponentModel.DataAnnotations;
namespace api2.DTOs;

public class WishlistCreateDto
{
    [Required]
    public int UserId { get; set; }

    [Required]
    public int ProductId { get; set; }
}

public class WishlistUpdateDto
{
    public int? UserId { get; set; }
    public int? ProductId { get; set; }
    public DateTime? AddedDate { get; set; }
}