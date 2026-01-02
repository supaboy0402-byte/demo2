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
    public class ProductTagMappingsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public ProductTagMappingsController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/ProductTagMappings
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductTagMapping>>> GetProductTagMappings()
        {
            return await _context.ProductTagMappings.ToListAsync();
        }

        // GET: api/ProductTagMappings/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductTagMapping>> GetProductTagMapping(int id)
        {
            var productTagMapping = await _context.ProductTagMappings.FindAsync(id);

            if (productTagMapping == null)
            {
                return NotFound();
            }

            return productTagMapping;
        }

        // PUT: api/ProductTagMappings/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductTagMapping(int id, ProductTagMappingUpdateDto dto)
        {
            var entity = await _context.ProductTagMappings.FindAsync(id);
            if (entity == null)
            {
                return NotFound();
            }

            if (dto.ProductId.HasValue) entity.ProductId = dto.ProductId.Value;
            if (dto.TagId.HasValue) entity.TagId = dto.TagId.Value;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                throw;
            }

            return NoContent();
        }

        // POST: api/ProductTagMappings
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ProductTagMapping>> PostProductTagMapping(ProductTagMappingCreateDto dto)
        {
            var entity = new ProductTagMapping
            {
                ProductId = dto.ProductId,
                TagId = dto.TagId
            };

            _context.ProductTagMappings.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProductTagMapping", new { id = entity.ProductTagId }, entity);
        }

        // DELETE: api/ProductTagMappings/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductTagMapping(int id)
        {
            var productTagMapping = await _context.ProductTagMappings.FindAsync(id);
            if (productTagMapping == null)
            {
                return NotFound();
            }

            _context.ProductTagMappings.Remove(productTagMapping);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProductTagMappingExists(int id)
        {
            return _context.ProductTagMappings.Any(e => e.ProductTagId == id);
        }
    }
}
