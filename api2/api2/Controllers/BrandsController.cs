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
    public class BrandsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public BrandsController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/Brands
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Brand>>> GetBrand()
        {
            return await _context.Brands.ToListAsync();
        }

        // GET: api/Brands/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Brand>> GetBrand(int id)
        {
            var brand = await _context.Brands.FindAsync(id);

            if (brand == null)
            {
                return NotFound();
            }

            return brand;
        }

        // PUT: api/Brands/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBrand(int id, [FromBody] BrandUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.BrandName))
            {
                return BadRequest("BrandName is required");
            }

            var brand = await _context.Brands.FindAsync(id);
            if (brand == null)
            {
                return NotFound();
            }

            var nameExists = await _context.Brands.AnyAsync(b => b.BrandName == dto.BrandName && b.BrandId != id);
            if (nameExists)
            {
                return Conflict("BrandName already exists");
            }

            brand.BrandName = dto.BrandName;
            brand.Country = dto.Country;
            brand.Description = dto.Description;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Brands
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Brand>> PostBrand([FromBody] BrandCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.BrandName))
            {
                return BadRequest("BrandName is required");
            }

            var exists = await _context.Brands.AnyAsync(b => b.BrandName == dto.BrandName);
            if (exists)
            {
                return Conflict("BrandName already exists");
            }

            var brand = new Brand
            {
                BrandName = dto.BrandName,
                Country = dto.Country,
                Description = dto.Description
            };

            _context.Brands.Add(brand);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetBrand", new { id = brand.BrandId }, brand);
        }

        // DELETE: api/Brands/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBrand(int id)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null)
            {
                return NotFound();
            }

            _context.Brands.Remove(brand);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BrandExists(int id)
        {
            return _context.Brands.Any(e => e.BrandId == id);
        }
    }
}
