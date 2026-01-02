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
    public class StockDetailsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public StockDetailsController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/StockDetails
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StockDetail>>> GetStockDetails()
        {
            return await _context.StockDetails.ToListAsync();
        }

        // GET: api/StockDetails/5
        [HttpGet("{id}")]
        public async Task<ActionResult<StockDetail>> GetStockDetail(int id)
        {
            var stockDetail = await _context.StockDetails.FindAsync(id);

            if (stockDetail == null)
            {
                return NotFound();
            }

            return stockDetail;
        }

        // PUT: api/StockDetails/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutStockDetail(int id, StockDetailUpdateDto dto)
        {
            var stockDetail = await _context.StockDetails.FindAsync(id);
            if (stockDetail == null)
            {
                return NotFound();
            }

            var movementExists = await _context.StockMovements.AnyAsync(m => m.StockMovementId == dto.StockMovementId);
            if (!movementExists)
            {
                return BadRequest("StockMovementId không tồn tại");
            }

            var productExists = await _context.Products.AnyAsync(p => p.ProductId == dto.ProductId);
            if (!productExists)
            {
                return BadRequest("ProductId không tồn tại");
            }

            stockDetail.StockMovementId = dto.StockMovementId;
            stockDetail.ProductId = dto.ProductId;
            stockDetail.Quantity = dto.Quantity;
            stockDetail.UnitCost = dto.UnitCost;
            stockDetail.Note = dto.Note;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!StockDetailExists(id))
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

        // POST: api/StockDetails
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<StockDetail>> PostStockDetail(StockDetailCreateDto dto)
        {
            var movementExists = await _context.StockMovements.AnyAsync(m => m.StockMovementId == dto.StockMovementId);
            if (!movementExists)
            {
                return BadRequest("StockMovementId không tồn tại");
            }

            var productExists = await _context.Products.AnyAsync(p => p.ProductId == dto.ProductId);
            if (!productExists)
            {
                return BadRequest("ProductId không tồn tại");
            }

            var stockDetail = new StockDetail
            {
                StockMovementId = dto.StockMovementId,
                ProductId = dto.ProductId,
                Quantity = dto.Quantity,
                UnitCost = dto.UnitCost,
                Note = dto.Note
            };

            _context.StockDetails.Add(stockDetail);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetStockDetail", new { id = stockDetail.StockDetailId }, stockDetail);
        }

        // DELETE: api/StockDetails/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStockDetail(int id)
        {
            var stockDetail = await _context.StockDetails.FindAsync(id);
            if (stockDetail == null)
            {
                return NotFound();
            }

            _context.StockDetails.Remove(stockDetail);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool StockDetailExists(int id)
        {
            return _context.StockDetails.Any(e => e.StockDetailId == id);
        }
    }
}
