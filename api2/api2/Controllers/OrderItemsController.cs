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
    public class OrderItemsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public OrderItemsController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/OrderItems
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderItem>>> GetOrderItems()
        {
            return await _context.OrderItems.ToListAsync();
        }

        // GET: api/OrderItems/5
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderItem>> GetOrderItem(int id)
        {
            var orderItem = await _context.OrderItems.FindAsync(id);

            if (orderItem == null)
            {
                return NotFound();
            }

            return orderItem;
        }

        // PUT: api/OrderItems/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOrderItem(int id, OrderItemUpdateDto dto)
        {
            var entity = await _context.OrderItems.FindAsync(id);
            if (entity == null)
            {
                return NotFound();
            }

            if (dto.OrderId.HasValue)
            {
                var order = await _context.Orders.FindAsync(dto.OrderId.Value);
                if (order == null) return NotFound();
                entity.OrderId = dto.OrderId.Value;
            }

            if (dto.ProductId.HasValue)
            {
                var product = await _context.Products.FindAsync(dto.ProductId.Value);
                if (product == null) return NotFound();
                entity.ProductId = dto.ProductId.Value;
                entity.UnitPrice = product.DiscountPrice ?? product.UnitPrice;
            }

            if (dto.Quantity.HasValue) entity.Quantity = dto.Quantity.Value;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!OrderItemExists(id))
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

        // POST: api/OrderItems
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<OrderItem>> PostOrderItem(OrderItemCreateDirectDto dto)
        {
            var order = await _context.Orders.FindAsync(dto.OrderId);
            if (order == null)
            {
                return NotFound();
            }

            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null)
            {
                return NotFound();
            }

            var entity = new OrderItem
            {
                OrderId = dto.OrderId,
                ProductId = dto.ProductId,
                Quantity = dto.Quantity,
                UnitPrice = product.DiscountPrice ?? product.UnitPrice
            };

            _context.OrderItems.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetOrderItem", new { id = entity.OrderItemId }, entity);
        }

        // DELETE: api/OrderItems/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrderItem(int id)
        {
            var orderItem = await _context.OrderItems.FindAsync(id);
            if (orderItem == null)
            {
                return NotFound();
            }

            _context.OrderItems.Remove(orderItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool OrderItemExists(int id)
        {
            return _context.OrderItems.Any(e => e.OrderItemId == id);
        }
    }
}
