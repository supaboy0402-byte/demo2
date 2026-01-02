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
    public class ProductsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public ProductsController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/Products
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts([FromQuery] int? status)
        {
            var q = _context.Products.AsNoTracking();
            if (status.HasValue) q = q.Where(p => p.Status == status.Value);
            return await q.ToListAsync();
        }

        // GET: api/Products/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound();
            }

            return product;
        }

        // PUT: api/Products/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduct(int id, ProductUpdateDto dto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            if (dto.Slug != null)
            {
                var duplicateSlug = await _context.Products.AnyAsync(p => p.Slug == dto.Slug && p.ProductId != id);
                if (duplicateSlug) return Conflict(new { message = "Slug đã tồn tại" });
            }
            if (dto.Sku != null)
            {
                var duplicateSku = await _context.Products.AnyAsync(p => p.Sku == dto.Sku && p.ProductId != id);
                if (duplicateSku) return Conflict(new { message = "SKU đã tồn tại" });
            }

            if (dto.ProductName != null) product.ProductName = dto.ProductName;
            if (dto.Slug != null) product.Slug = dto.Slug;
            if (dto.Sku != null) product.Sku = dto.Sku;
            if (dto.CategoryId.HasValue) product.CategoryId = dto.CategoryId;
            if (dto.BrandId.HasValue) product.BrandId = dto.BrandId;
            if (dto.UnitPrice.HasValue) product.UnitPrice = dto.UnitPrice.Value;
            product.CostPrice = dto.CostPrice;
            product.DiscountPrice = dto.DiscountPrice;
            if (dto.Quantity.HasValue) product.Quantity = dto.Quantity.Value;
            if (dto.IsFeatured.HasValue) product.IsFeatured = dto.IsFeatured.Value;
            if (dto.Status.HasValue) product.Status = dto.Status.Value;
            if (dto.MetaDescription != null) product.MetaDescription = dto.MetaDescription;
            if (dto.Description != null) product.Description = dto.Description;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(id))
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

        // POST: api/Products
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Product>> PostProduct(ProductCreateDto dto)
        {
            if (dto.Slug != null)
            {
                var exists = await _context.Products.AnyAsync(p => p.Slug == dto.Slug);
                if (exists) return Conflict(new { message = "Slug đã tồn tại" });
            }
            if (dto.Sku != null)
            {
                var existsSku = await _context.Products.AnyAsync(p => p.Sku == dto.Sku);
                if (existsSku) return Conflict(new { message = "SKU đã tồn tại" });
            }
            var product = new Product
            {
                ProductName = dto.ProductName,
                Slug = dto.Slug,
                Sku = dto.Sku,
                CategoryId = dto.CategoryId,
                BrandId = dto.BrandId,
                UnitPrice = dto.UnitPrice,
                CostPrice = dto.CostPrice,
                DiscountPrice = dto.DiscountPrice,
                Quantity = dto.Quantity,
                IsFeatured = dto.IsFeatured,
                Status = dto.Status ?? 1,
                MetaDescription = dto.MetaDescription,
                Description = dto.Description
            };
            _context.Products.Add(product);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict(new { message = "Không thể tạo sản phẩm do dữ liệu trùng lặp hoặc không hợp lệ" });
            }

            return CreatedAtAction("GetProduct", new { id = product.ProductId }, product);
        }

        // DELETE: api/Products/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id, [FromQuery] bool? force)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }
            var forceFlag = (force.HasValue && force.Value);
            if (!forceFlag && Request?.Query != null)
            {
                if (Request.Query.TryGetValue("force", out var fv))
                {
                    var raw = fv.ToString();
                    if (string.Equals(raw, "1") || string.Equals(raw, "true", StringComparison.OrdinalIgnoreCase))
                    {
                        forceFlag = true;
                    }
                }
            }
            if (forceFlag)
            {
                using var tx = await _context.Database.BeginTransactionAsync();
                try
                {
                    var orderItems = await _context.OrderItems.Where(oi => oi.ProductId == id).ToListAsync();
                    if (orderItems.Count > 0) _context.OrderItems.RemoveRange(orderItems);

                    var wishlists = await _context.Wishlists.Where(w => w.ProductId == id).ToListAsync();
                    if (wishlists.Count > 0) _context.Wishlists.RemoveRange(wishlists);

                    var reviews = await _context.Reviews.Where(r => r.ProductId == id).ToListAsync();
                    if (reviews.Count > 0) _context.Reviews.RemoveRange(reviews);

                    var warranties = await _context.WarrantyTickets.Where(w => w.ProductId == id).ToListAsync();
                    if (warranties.Count > 0) _context.WarrantyTickets.RemoveRange(warranties);

                    var stockDetails = await _context.StockDetails.Where(sd => sd.ProductId == id).ToListAsync();
                    if (stockDetails.Count > 0) _context.StockDetails.RemoveRange(stockDetails);

                    var images = await _context.ProductImages.Where(i => i.ProductId == id).ToListAsync();
                    if (images.Count > 0) _context.ProductImages.RemoveRange(images);
                    var specs = await _context.ProductSpecifications.Where(s => s.ProductId == id).ToListAsync();
                    if (specs.Count > 0) _context.ProductSpecifications.RemoveRange(specs);
                    var tagMaps = await _context.ProductTagMappings.Where(m => m.ProductId == id).ToListAsync();
                    if (tagMaps.Count > 0) _context.ProductTagMappings.RemoveRange(tagMaps);

                    _context.Products.Remove(product);
                    await _context.SaveChangesAsync();
                    await tx.CommitAsync();
                    return NoContent();
                }
                catch
                {
                    await tx.RollbackAsync();
                    return Conflict(new { message = "Không thể xóa vĩnh viễn sản phẩm" });
                }
            }

            var hasLinks = await _context.OrderItems.AnyAsync(x => x.ProductId == id)
                || await _context.Wishlists.AnyAsync(x => x.ProductId == id)
                || await _context.Reviews.AnyAsync(x => x.ProductId == id)
                || await _context.WarrantyTickets.AnyAsync(x => x.ProductId == id)
                || await _context.StockDetails.AnyAsync(x => x.ProductId == id);

            if (hasLinks)
            {
                product.Status = 0;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Sản phẩm đang liên kết với dữ liệu khác, đã chuyển sang trạng thái vô hiệu hóa" });
            }

            var images2 = await _context.ProductImages.Where(i => i.ProductId == id).ToListAsync();
            if (images2.Count > 0) _context.ProductImages.RemoveRange(images2);
            var specs2 = await _context.ProductSpecifications.Where(s => s.ProductId == id).ToListAsync();
            if (specs2.Count > 0) _context.ProductSpecifications.RemoveRange(specs2);
            var tagMaps2 = await _context.ProductTagMappings.Where(m => m.ProductId == id).ToListAsync();
            if (tagMaps2.Count > 0) _context.ProductTagMappings.RemoveRange(tagMaps2);

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool ProductExists(int id)
        {
            return _context.Products.Any(e => e.ProductId == id);
        }
    }
}
