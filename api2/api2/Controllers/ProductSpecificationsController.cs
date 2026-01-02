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
    public class ProductSpecificationsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public ProductSpecificationsController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/ProductSpecifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductSpecification>>> GetProductSpecifications()
        {
            return await _context.ProductSpecifications.ToListAsync();
        }

        // GET: api/ProductSpecifications/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductSpecification>> GetProductSpecification(int id)
        {
            var productSpecification = await _context.ProductSpecifications.FindAsync(id);

            if (productSpecification == null)
            {
                return NotFound();
            }

            return productSpecification;
        }

        // PUT: api/ProductSpecifications/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductSpecification(int id, ProductSpecificationUpdateDto dto)
        {
            var productSpecification = await _context.ProductSpecifications.FindAsync(id);
            if (productSpecification == null)
            {
                return NotFound();
            }

            if (dto.ProductId.HasValue) productSpecification.ProductId = dto.ProductId.Value;
            if (dto.SpecName != null) productSpecification.SpecName = dto.SpecName;
            if (dto.SpecValue != null) productSpecification.SpecValue = dto.SpecValue;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductSpecificationExists(id))
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

        // POST: api/ProductSpecifications
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ProductSpecification>> PostProductSpecification(ProductSpecificationCreateDto dto)
        {
            var productSpecification = new ProductSpecification
            {
                ProductId = dto.ProductId,
                SpecName = dto.SpecName,
                SpecValue = dto.SpecValue
            };
            _context.ProductSpecifications.Add(productSpecification);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProductSpecification", new { id = productSpecification.SpecId }, productSpecification);
        }

        // DELETE: api/ProductSpecifications/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductSpecification(int id)
        {
            var productSpecification = await _context.ProductSpecifications.FindAsync(id);
            if (productSpecification == null)
            {
                return NotFound();
            }

            _context.ProductSpecifications.Remove(productSpecification);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProductSpecificationExists(int id)
        {
            return _context.ProductSpecifications.Any(e => e.SpecId == id);
        }
    }
}
