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
    public class StockMovementsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public StockMovementsController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/StockMovements
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StockMovement>>> GetStockMovements()
        {
            return await _context.StockMovements.ToListAsync();
        }

        // GET: api/StockMovements/5
        [HttpGet("{id}")]
        public async Task<ActionResult<StockMovement>> GetStockMovement(int id)
        {
            var stockMovement = await _context.StockMovements.FindAsync(id);

            if (stockMovement == null)
            {
                return NotFound();
            }

            return stockMovement;
        }

        // PUT: api/StockMovements/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutStockMovement(int id, StockMovementUpdateDto dto)
        {
            var entity = await _context.StockMovements.FindAsync(id);
            if (entity == null)
            {
                return NotFound();
            }

            if (dto.MovementType != null) entity.MovementType = dto.MovementType;
            if (dto.ReferenceType != null) entity.ReferenceType = dto.ReferenceType;
            if (dto.ReferenceId.HasValue) entity.ReferenceId = dto.ReferenceId;
            if (dto.ReferenceCode != null) entity.ReferenceCode = dto.ReferenceCode;
            if (dto.Note != null) entity.Note = dto.Note;
            if (dto.CreatedBy.HasValue) entity.CreatedBy = dto.CreatedBy;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!StockMovementExists(id))
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

        // POST: api/StockMovements
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<StockMovement>> PostStockMovement(StockMovementCreateDto dto)
        {
            var entity = new StockMovement
            {
                MovementType = dto.MovementType,
                ReferenceType = dto.ReferenceType,
                ReferenceId = dto.ReferenceId,
                ReferenceCode = dto.ReferenceCode,
                Note = dto.Note,
                CreatedBy = dto.CreatedBy
            };
            _context.StockMovements.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetStockMovement", new { id = entity.StockMovementId }, entity);
        }

        [HttpPost("apply")]
        public async Task<IActionResult> ApplyStockMovement(StockMovementApplyDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.MovementType)) return BadRequest("MovementType is required");
            var mt = dto.MovementType.Trim().ToUpperInvariant();
            if (mt != "IN" && mt != "OUT") return BadRequest("MovementType must be IN or OUT");
            if (dto.Details == null || dto.Details.Count == 0) return BadRequest("Details cannot be empty");

            var ids = dto.Details.Select(d => d.ProductId).Distinct().ToList();
            var products = await _context.Products.Where(p => ids.Contains(p.ProductId)).ToListAsync();
            if (products.Count != ids.Count) return BadRequest("One or more ProductId not found");

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var movement = new StockMovement
                {
                    MovementType = mt,
                    ReferenceType = dto.ReferenceType,
                    ReferenceId = dto.ReferenceId,
                    ReferenceCode = dto.ReferenceCode,
                    Note = dto.Note,
                    CreatedBy = dto.CreatedBy,
                };
                _context.StockMovements.Add(movement);
                await _context.SaveChangesAsync();

                foreach (var d in dto.Details)
                {
                    var detail = new StockDetail
                    {
                        StockMovementId = movement.StockMovementId,
                        ProductId = d.ProductId,
                        Quantity = d.Quantity,
                        UnitCost = d.UnitCost,
                        Note = d.Note,
                    };
                    _context.StockDetails.Add(detail);
                }
                await _context.SaveChangesAsync();

                var changeByProduct = dto.Details
                    .GroupBy(d => d.ProductId)
                    .Select(g => new { ProductId = g.Key, QtyChange = mt == "IN" ? g.Sum(x => x.Quantity) : -g.Sum(x => x.Quantity) })
                    .ToList();

                foreach (var ch in changeByProduct)
                {
                    var p = products.First(x => x.ProductId == ch.ProductId);
                    var newQty = p.Quantity + ch.QtyChange;
                    if (newQty < 0)
                    {
                        await tx.RollbackAsync();
                        return BadRequest("Operation would result in negative stock for at least one product");
                    }
                    p.Quantity = newQty;
                }
                await _context.SaveChangesAsync();

                await tx.CommitAsync();
                return Ok(new { stockMovementId = movement.StockMovementId });
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        // DELETE: api/StockMovements/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStockMovement(int id)
        {
            var stockMovement = await _context.StockMovements.FindAsync(id);
            if (stockMovement == null)
            {
                return NotFound();
            }

            _context.StockMovements.Remove(stockMovement);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool StockMovementExists(int id)
        {
            return _context.StockMovements.Any(e => e.StockMovementId == id);
        }
    }
}
