using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api2.Models;

namespace api2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PromotionsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public PromotionsController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/Promotions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Promotion>>> GetPromotions()
        {
            return await _context.Promotions.ToListAsync();
        }

        // GET: api/Promotions/slug/{slug}
        [HttpGet("slug/{slug}")]
        public async Task<ActionResult<Promotion>> GetPromotionBySlug(string slug)
        {
            if (string.IsNullOrWhiteSpace(slug)) return BadRequest();
            var s = slug.Trim();
            var promotion = await _context.Promotions
                .FirstOrDefaultAsync(p => ((p.Slug ?? "").Trim().ToLower()) == s.ToLower());
            if (promotion == null) return NotFound();
            return Ok(promotion);
        }

        // GET: api/Promotions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Promotion>> GetPromotion(int id)
        {
            var promotion = await _context.Promotions.FindAsync(id);

            if (promotion == null)
            {
                return NotFound();
            }

            return promotion;
        }

        // PUT: api/Promotions/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPromotion(int id, Promotion promotion)
        {
            if (id != promotion.PromotionId)
            {
                return BadRequest();
            }

            _context.Entry(promotion).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PromotionExists(id))
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

        // POST: api/Promotions
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Promotion>> PostPromotion(Promotion promotion)
        {
            _context.Promotions.Add(promotion);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetPromotion", new { id = promotion.PromotionId }, promotion);
        }

        // DELETE: api/Promotions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePromotion(int id)
        {
            var promotion = await _context.Promotions.FindAsync(id);
            if (promotion == null)
            {
                return NotFound();
            }

            _context.Promotions.Remove(promotion);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PromotionExists(int id)
        {
            return _context.Promotions.Any(e => e.PromotionId == id);
        }

        // GET: api/Promotions/{id}/products
        [HttpGet("{id}/products")]
        public async Task<IActionResult> GetPromotionProducts(int id)
        {
            var promo = await _context.Promotions.AsNoTracking().FirstOrDefaultAsync(p => p.PromotionId == id);
            if (promo == null) return NotFound();

            var tagName = $"promo:id:{id}";
            var tag = await _context.Tags.AsNoTracking().FirstOrDefaultAsync(t => t.TagName == tagName);
            if (tag == null) return Ok(new List<Product>());

            var tagId = tag.TagId;
            var products = await _context.Products
                .AsNoTracking()
                .Where(p => _context.ProductTagMappings.Any(m => m.ProductId == p.ProductId && m.TagId == tagId))
                .ToListAsync();

            return Ok(products);
        }

        // POST: api/Promotions/{id}/products/map
        [HttpPost("{id}/products/map")]
        public async Task<IActionResult> MapPromotionProducts(int id, [FromBody] int[] productIds)
        {
            var promo = await _context.Promotions.FirstOrDefaultAsync(p => p.PromotionId == id);
            if (promo == null) return NotFound();

            var tagName = $"promo:id:{id}";
            var tag = await _context.Tags.FirstOrDefaultAsync(t => t.TagName == tagName);
            if (tag == null)
            {
                tag = new Tag { TagName = tagName };
                _context.Tags.Add(tag);
                await _context.SaveChangesAsync();
            }

            var set = new HashSet<int>(productIds ?? Array.Empty<int>());
            var existing = await _context.ProductTagMappings
                .Where(m => m.TagId == tag.TagId)
                .Select(m => m.ProductId)
                .ToListAsync();

            var toAdd = set.Except(existing).ToList();

            foreach (var pid in toAdd)
            {
                var existsProduct = await _context.Products.AnyAsync(p => p.ProductId == pid);
                if (!existsProduct) continue;
                _context.ProductTagMappings.Add(new ProductTagMapping { ProductId = pid, TagId = tag.TagId });
            }

            await _context.SaveChangesAsync();
            return Ok(new { added = toAdd.Count, tagId = tag.TagId });
        }

        // DELETE: api/Promotions/{id}/products/{productId}
        [HttpDelete("{id}/products/{productId}")]
        public async Task<IActionResult> UnmapPromotionProduct(int id, int productId)
        {
            var tagName = $"promo:id:{id}";
            var tag = await _context.Tags.FirstOrDefaultAsync(t => t.TagName == tagName);
            if (tag == null) return NotFound();

            var mapping = await _context.ProductTagMappings
                .FirstOrDefaultAsync(m => m.TagId == tag.TagId && m.ProductId == productId);
            if (mapping == null) return NotFound();

            _context.ProductTagMappings.Remove(mapping);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Promotions/{id}/products/count
        [HttpGet("{id}/products/count")]
        public async Task<IActionResult> GetPromotionProductsCount(int id)
        {
            var tagName = $"promo:id:{id}";
            var tag = await _context.Tags.AsNoTracking().FirstOrDefaultAsync(t => t.TagName == tagName);
            if (tag == null) return Ok(new { count = 0 });

            var count = await _context.ProductTagMappings.CountAsync(m => m.TagId == tag.TagId);
            return Ok(new { count });
        }

        [HttpPost("upload-image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No file");
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType)) return BadRequest("Unsupported file type");
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExts = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };
            if (!allowedExts.Contains(ext)) return BadRequest("Unsupported extension");
            if (file.Length > 5 * 1024 * 1024) return BadRequest("File too large");

            var wwwroot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var dir = Path.Combine(wwwroot, "promotion-images");
            Directory.CreateDirectory(dir);
            var name = Guid.NewGuid().ToString("N") + ext;
            var fullPath = Path.Combine(dir, name);
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            var url = "/promotion-images/" + name;
            return Ok(new { url });
        }
    }
}
