using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
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
    public class ProductImagesController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public ProductImagesController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/ProductImages
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductImage>>> GetProductImages()
        {
            return await _context.ProductImages.ToListAsync();
        }

        // GET: api/ProductImages/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductImage>> GetProductImage(int id)
        {
            var productImage = await _context.ProductImages.FindAsync(id);

            if (productImage == null)
            {
                return NotFound();
            }

            return productImage;
        }

        // PUT: api/ProductImages/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductImage(int id, ProductImageUpdateDto dto)
        {
            var productImage = await _context.ProductImages.FindAsync(id);
            if (productImage == null)
            {
                return NotFound();
            }

            if (dto.ProductId.HasValue) productImage.ProductId = dto.ProductId.Value;
            if (dto.ImageUrl != null) productImage.ImageUrl = dto.ImageUrl;
            if (dto.AltText != null) productImage.AltText = dto.AltText;
            if (dto.IsMain.HasValue) productImage.IsMain = dto.IsMain.Value;
            if (dto.SortOrder.HasValue) productImage.SortOrder = dto.SortOrder;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductImageExists(id))
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

        // POST: api/ProductImages
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ProductImage>> PostProductImage(ProductImageCreateDto dto)
        {
            var productImage = new ProductImage
            {
                ProductId = dto.ProductId,
                ImageUrl = dto.ImageUrl,
                AltText = dto.AltText,
                IsMain = dto.IsMain ?? false,
                SortOrder = dto.SortOrder
            };
            _context.ProductImages.Add(productImage);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProductImage", new { id = productImage.ImageId }, productImage);
        }

        // POST: api/ProductImages/upload/{productId}
        [HttpPost("upload/{productId}")]
        public async Task<IActionResult> UploadImages(int productId, [FromForm] List<IFormFile> files)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return NotFound();

            if (files == null || files.Count == 0) return BadRequest("No files");

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            var allowedExts = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };
            var maxSize = 5 * 1024 * 1024;

            var wwwroot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var dir = Path.Combine(wwwroot, "product-images");
            Directory.CreateDirectory(dir);

            var existing = await _context.ProductImages.Where(i => i.ProductId == productId).ToListAsync();
            var nextSort = (existing.Count > 0 ? existing.Max(i => i.SortOrder ?? 0) : 0) + 1;

            var created = new List<ProductImage>();

            foreach (var file in files)
            {
                if (file == null || file.Length == 0) continue;
                if (file.Length > maxSize) return BadRequest("File too large");
                if (!allowedTypes.Contains(file.ContentType)) return BadRequest("Unsupported file type");

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExts.Contains(ext)) return BadRequest("Unsupported extension");

                var name = Guid.NewGuid().ToString("N") + ext;
                var fullPath = Path.Combine(dir, name);
                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var entity = new ProductImage
                {
                    ProductId = productId,
                    ImageUrl = "/product-images/" + name,
                    AltText = null,
                    IsMain = false,
                    SortOrder = nextSort++,
                };
                _context.ProductImages.Add(entity);
                created.Add(entity);
            }

            if (created.Count == 0) return BadRequest("No valid files");

            if (!existing.Any(e => e.IsMain))
            {
                created[0].IsMain = true;
            }

            await _context.SaveChangesAsync();

            return Ok(created);
        }

        public class ReorderRequest
        {
            public List<int> ImageIds { get; set; } = new List<int>();
            public int? MainImageId { get; set; }
        }

        // POST: api/ProductImages/reorder/{productId}
        [HttpPost("reorder/{productId}")]
        public async Task<IActionResult> ReorderImages(int productId, [FromBody] ReorderRequest req)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return NotFound();
            if (req == null || req.ImageIds == null || req.ImageIds.Count == 0) return BadRequest("Invalid payload");

            var images = await _context.ProductImages.Where(i => i.ProductId == productId).ToListAsync();
            var set = new HashSet<int>(images.Select(i => i.ImageId));
            foreach (var id in req.ImageIds)
            {
                if (!set.Contains(id)) return BadRequest("Image not found: " + id);
            }

            int order = 1;
            foreach (var id in req.ImageIds)
            {
                var img = images.First(i => i.ImageId == id);
                img.SortOrder = order++;
            }

            foreach (var img in images.Where(i => !req.ImageIds.Contains(i.ImageId)).OrderBy(i => i.SortOrder ?? int.MaxValue))
            {
                img.SortOrder = order++;
            }

            var mainId = req.MainImageId ?? req.ImageIds.FirstOrDefault();
            foreach (var img in images)
            {
                img.IsMain = (img.ImageId == mainId);
            }

            await _context.SaveChangesAsync();

            var updated = await _context.ProductImages.Where(i => i.ProductId == productId).OrderBy(i => i.SortOrder ?? int.MaxValue).ToListAsync();
            return Ok(updated);
        }

        // DELETE: api/ProductImages/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductImage(int id)
        {
            var productImage = await _context.ProductImages.FindAsync(id);
            if (productImage == null)
            {
                return NotFound();
            }
            try
            {
                var url = productImage.ImageUrl ?? string.Empty;
                if (url.StartsWith("/product-images/", StringComparison.OrdinalIgnoreCase))
                {
                    var name = url.Substring("/product-images/".Length);
                    var wwwroot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var fullPath = Path.Combine(wwwroot, "product-images", name);
                    if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
                }
            }
            catch
            {
            }

            _context.ProductImages.Remove(productImage);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProductImageExists(int id)
        {
            return _context.ProductImages.Any(e => e.ImageId == id);
        }
    }
}
