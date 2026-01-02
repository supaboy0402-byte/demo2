using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api2.Models;
using api2.DTOs;

namespace api2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public OrdersController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/Orders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
        {
            return await _context.Orders.ToListAsync();
        }

        [HttpGet("by-code/{code}")]
        public async Task<IActionResult> GetOrderByCode(string code)
        {
            var trimmed = (code ?? string.Empty).Trim();
            var order = await _context.Orders
                .AsNoTracking()
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderCode.ToUpper() == trimmed.ToUpper());

            if (order == null) return NotFound();

            var result = new
            {
                OrderId = order.OrderId,
                OrderCode = order.OrderCode,
                UserId = order.UserId,
                Items = order.OrderItems.Select(oi => new { oi.ProductId, oi.Quantity }).ToList()
            };

            return Ok(result);
        }

        [HttpGet("by-code/{code}/items")]
        public async Task<IActionResult> GetOrderItemsByCode(string code)
        {
            var trimmed = (code ?? string.Empty).Trim();
            var order = await _context.Orders
                .AsNoTracking()
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.OrderCode.ToUpper() == trimmed.ToUpper());

            if (order == null) return NotFound();

            var items = order.OrderItems.Select(oi => new
            {
                ProductId = oi.ProductId,
                ProductName = oi.Product != null ? oi.Product.ProductName : null,
                Quantity = oi.Quantity
            }).ToList();

            return Ok(new
            {
                OrderId = order.OrderId,
                OrderCode = order.OrderCode,
                UserId = order.UserId,
                Items = items
            });
        }

        [HttpGet("by-code/{code}/shipped-items")]
        public async Task<IActionResult> GetOrderShippedItemsByCode(string code)
        {
            var trimmed = (code ?? string.Empty).Trim();
            var outs = await _context.StockMovements
                .AsNoTracking()
                .Where(sm => sm.MovementType.ToUpper() == "OUT" && sm.ReferenceCode != null && sm.ReferenceCode.ToUpper() == trimmed.ToUpper())
                .Include(sm => sm.StockDetails)
                    .ThenInclude(sd => sd.Product)
                .ToListAsync();

            if (outs.Count == 0)
            {
                return Ok(new { Items = new object[] { } });
            }

            var merged = outs
                .SelectMany(sm => sm.StockDetails)
                .GroupBy(sd => sd.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    ProductName = g.First().Product != null ? g.First().Product.ProductName : null,
                    Quantity = g.Sum(x => x.Quantity)
                })
                .ToList();

            return Ok(new { Items = merged });
        }

        // GET: api/Orders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Order>> GetOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);

            if (order == null)
            {
                return NotFound();
            }

            return order;
        }

        // PUT: api/Orders/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOrder(int id, OrderUpdateDto dto)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound();
            }

            if (dto.OrderCode != null) order.OrderCode = dto.OrderCode;
            if (dto.UserId.HasValue) order.UserId = dto.UserId;
            if (dto.Status.HasValue) order.Status = dto.Status.Value;
            if (dto.ShippingMethod.HasValue) order.ShippingMethod = dto.ShippingMethod.Value;
            if (dto.ShippingAddress != null) order.ShippingAddress = dto.ShippingAddress;
            if (dto.SubTotal.HasValue) order.SubTotal = dto.SubTotal.Value;
            if (dto.DiscountAmount.HasValue) order.DiscountAmount = dto.DiscountAmount.Value;
            if (dto.TotalAmount.HasValue) order.TotalAmount = dto.TotalAmount.Value;
            if (dto.CouponId.HasValue) order.CouponId = dto.CouponId;
            if (dto.OrderDate.HasValue) order.OrderDate = dto.OrderDate.Value;
            if (dto.CreatedAt.HasValue) order.CreatedAt = dto.CreatedAt.Value;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!OrderExists(id))
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

        // POST: api/Orders
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Order>> PostOrder(OrderCreateDto dto)
        {
            var order = new Order
            {
                OrderCode = dto.OrderCode,
                UserId = dto.UserId,
                Status = dto.Status,
                ShippingMethod = dto.ShippingMethod,
                ShippingAddress = dto.ShippingAddress,
                SubTotal = dto.SubTotal,
                DiscountAmount = dto.DiscountAmount,
                TotalAmount = dto.TotalAmount,
                CouponId = dto.CouponId
            };

            if (dto.OrderDate.HasValue)
            {
                order.OrderDate = dto.OrderDate.Value;
            }

            if (dto.CreatedAt.HasValue)
            {
                order.CreatedAt = dto.CreatedAt.Value;
            }

            if (dto.OrderItems != null)
            {
                foreach (var item in dto.OrderItems)
                {
                    order.OrderItems.Add(new OrderItem
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice
                    });
                }
            }

            if (dto.Payments != null)
            {
                foreach (var pay in dto.Payments)
                {
                    order.Payments.Add(new Payment
                    {
                        Amount = pay.Amount,
                        PaymentMethod = pay.PaymentMethod,
                        Status = pay.Status,
                        TransactionRef = pay.TransactionRef,
                        PaidAt = pay.PaidAt
                    });
                }
            }

            using (var tx = await _context.Database.BeginTransactionAsync())
            {
                if (dto.CouponId.HasValue)
                {
                    var affected = await _context.Database.ExecuteSqlRawAsync(
                        "UPDATE [store].[Coupons] SET [Quantity] = CASE WHEN [Quantity] IS NULL THEN NULL ELSE [Quantity] - 1 END WHERE [CouponID] = {0} AND ([Quantity] IS NULL OR [Quantity] > 0)",
                        dto.CouponId.Value
                    );
                    if (affected == 0)
                    {
                        await tx.RollbackAsync();
                        return BadRequest(new { message = "Mã giảm giá đã hết lượt sử dụng hoặc không hợp lệ" });
                    }
                }

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();
                await tx.CommitAsync();
            }

            return CreatedAtAction("GetOrder", new { id = order.OrderId }, order);
        }

        // DELETE: api/Orders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound();
            }

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var items = await _context.OrderItems.Where(oi => oi.OrderId == id).ToListAsync();
                if (items.Count > 0)
                {
                    _context.OrderItems.RemoveRange(items);
                    await _context.SaveChangesAsync();
                }

                var payments = await _context.Payments.Where(p => p.OrderId == id).ToListAsync();
                if (payments.Count > 0)
                {
                    _context.Payments.RemoveRange(payments);
                    await _context.SaveChangesAsync();
                }

                var warranties = await _context.WarrantyTickets.Where(w => w.OrderId == id).ToListAsync();
                if (warranties.Count > 0)
                {
                    _context.WarrantyTickets.RemoveRange(warranties);
                    await _context.SaveChangesAsync();
                }

                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();

                await tx.CommitAsync();
                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                await tx.RollbackAsync();
                return Problem(detail: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return Problem(detail: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        private bool OrderExists(int id)
        {
            return _context.Orders.Any(e => e.OrderId == id);
        }
    }
}
