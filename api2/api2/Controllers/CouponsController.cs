using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api2.Models;

namespace api2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CouponsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public CouponsController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/Coupons
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Coupon>>> GetCoupons()
        {
            return await _context.Coupons.ToListAsync();
        }

        // GET: api/Coupons/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Coupon>> GetCoupon(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);

            if (coupon == null)
            {
                return NotFound();
            }

            return coupon;
        }

        [HttpGet("validate")]
        public async Task<IActionResult> ValidateCoupon([FromQuery] string code, [FromQuery] decimal? subtotal)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return Ok(new { valid = false, message = "Thiếu mã giảm giá" });
            }
            var now = DateTime.Now;
            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == code);
            if (coupon == null)
            {
                return Ok(new { valid = false, message = "Không tìm thấy mã giảm giá" });
            }
            if (!coupon.IsActive)
            {
                return Ok(new { valid = false, message = "Mã giảm giá không hoạt động" });
            }
            if (coupon.StartDate.HasValue && coupon.StartDate.Value > now)
            {
                return Ok(new { valid = false, message = "Mã giảm giá chưa bắt đầu" });
            }
            if (coupon.EndDate.HasValue && coupon.EndDate.Value < now)
            {
                return Ok(new { valid = false, message = "Mã giảm giá đã hết hạn" });
            }
            if (coupon.Quantity.HasValue && coupon.Quantity.Value <= 0)
            {
                return Ok(new { valid = false, message = "Mã giảm giá đã hết lượt sử dụng" });
            }
            var discountAmount = 0m;
            if (subtotal.HasValue && subtotal.Value > 0)
            {
                if (string.Equals(coupon.DiscountType, "percent", StringComparison.OrdinalIgnoreCase))
                {
                    discountAmount = Math.Round(subtotal.Value * coupon.DiscountValue / 100m, 2, MidpointRounding.AwayFromZero);
                    if (discountAmount > subtotal.Value) discountAmount = subtotal.Value;
                }
                else
                {
                    discountAmount = coupon.DiscountValue;
                    if (discountAmount > subtotal.Value) discountAmount = subtotal.Value;
                }
            }
            return Ok(new { valid = true, id = coupon.CouponId, code = coupon.Code, discountType = coupon.DiscountType, discountValue = coupon.DiscountValue, discountAmount });
        }

        // PUT: api/Coupons/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCoupon(int id, Coupon coupon)
        {
            if (id != coupon.CouponId)
            {
                return BadRequest();
            }

            _context.Entry(coupon).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CouponExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Coupons
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Coupon>> PostCoupon(Coupon coupon)
        {
            _context.Coupons.Add(coupon);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCoupon", new { id = coupon.CouponId }, coupon);
        }

        // DELETE: api/Coupons/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCoupon(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null)
            {
                return NotFound();
            }

            _context.Coupons.Remove(coupon);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CouponExists(int id)
        {
            return _context.Coupons.Any(e => e.CouponId == id);
        }
    }
}
