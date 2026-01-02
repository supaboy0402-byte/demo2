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
    public class WarrantyTicketsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public WarrantyTicketsController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/WarrantyTickets
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WarrantyTicket>>> GetWarrantyTickets()
        {
            return await _context.WarrantyTickets.ToListAsync();
        }

        // GET: api/WarrantyTickets/5
        [HttpGet("{id}")]
        public async Task<ActionResult<WarrantyTicket>> GetWarrantyTicket(int id)
        {
            var warrantyTicket = await _context.WarrantyTickets.FindAsync(id);

            if (warrantyTicket == null)
            {
                return NotFound();
            }

            return warrantyTicket;
        }

        // PUT: api/WarrantyTickets/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutWarrantyTicket(int id, WarrantyTicketUpdateDto dto)
        {
            var entity = await _context.WarrantyTickets.FindAsync(id);
            if (entity == null)
            {
                return NotFound();
            }

            if (dto.WarrantyCode != null) entity.WarrantyCode = dto.WarrantyCode;

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
            }

            if (dto.UserId.HasValue) entity.UserId = dto.UserId.Value;
            if (dto.StaffHandledBy.HasValue) entity.StaffHandledBy = dto.StaffHandledBy.Value;
            if (dto.IssueDescription != null) entity.IssueDescription = dto.IssueDescription;
            if (dto.Diagnosis != null) entity.Diagnosis = dto.Diagnosis;
            if (dto.WarrantyStatus != null) entity.WarrantyStatus = dto.WarrantyStatus;
            if (dto.IsUnderWarranty.HasValue) entity.IsUnderWarranty = dto.IsUnderWarranty.Value;
            if (dto.ExtraCost.HasValue) entity.ExtraCost = dto.ExtraCost.Value;
            if (dto.CostNote != null) entity.CostNote = dto.CostNote;
            if (dto.EstimatedReturnDate.HasValue) entity.EstimatedReturnDate = dto.EstimatedReturnDate.Value;
            if (dto.CompletedDate.HasValue) entity.CompletedDate = dto.CompletedDate.Value;
            if (dto.CreatedAt.HasValue) entity.CreatedAt = dto.CreatedAt.Value;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WarrantyTicketExists(id))
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

        // POST: api/WarrantyTickets
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<WarrantyTicket>> PostWarrantyTicket(WarrantyTicketCreateDto dto)
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

            if (dto.UserId.HasValue)
            {
                var user = await _context.Users.FindAsync(dto.UserId.Value);
                if (user == null) return NotFound();
            }

            if (dto.StaffHandledBy.HasValue)
            {
                var staff = await _context.Users.FindAsync(dto.StaffHandledBy.Value);
                if (staff == null) return NotFound();
            }

            var entity = new WarrantyTicket
            {
                WarrantyCode = dto.WarrantyCode,
                OrderId = dto.OrderId,
                ProductId = dto.ProductId,
                UserId = dto.UserId,
                StaffHandledBy = dto.StaffHandledBy,
                IssueDescription = dto.IssueDescription,
                Diagnosis = dto.Diagnosis,
                WarrantyStatus = dto.WarrantyStatus ?? "Pending",
                IsUnderWarranty = dto.IsUnderWarranty ?? true,
                ExtraCost = dto.ExtraCost ?? 0m,
                CostNote = dto.CostNote,
                EstimatedReturnDate = dto.EstimatedReturnDate,
                CompletedDate = dto.CompletedDate
            };

            _context.WarrantyTickets.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetWarrantyTicket", new { id = entity.WarrantyId }, entity);
        }

        // DELETE: api/WarrantyTickets/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWarrantyTicket(int id)
        {
            var warrantyTicket = await _context.WarrantyTickets.FindAsync(id);
            if (warrantyTicket == null)
            {
                return NotFound();
            }

            _context.WarrantyTickets.Remove(warrantyTicket);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool WarrantyTicketExists(int id)
        {
            return _context.WarrantyTickets.Any(e => e.WarrantyId == id);
        }
    }
}
