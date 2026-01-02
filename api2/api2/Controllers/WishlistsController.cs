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
    public class WishlistsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public WishlistsController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/Wishlists
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Wishlist>>> GetWishlists()
        {
            return await _context.Wishlists.ToListAsync();
        }

        // GET: api/Wishlists/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Wishlist>> GetWishlist(int id)
        {
            var wishlist = await _context.Wishlists.FindAsync(id);

            if (wishlist == null)
            {
                return NotFound();
            }

            return wishlist;
        }

        // PUT: api/Wishlists/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutWishlist(int id, WishlistUpdateDto dto)
        {
            var entity = await _context.Wishlists.FindAsync(id);
            if (entity == null)
            {
                return NotFound();
            }

            var newUserId = entity.UserId;
            var newProductId = entity.ProductId;

            if (dto.UserId.HasValue)
            {
                var user = await _context.Users.FindAsync(dto.UserId.Value);
                if (user == null) return NotFound();
                newUserId = dto.UserId.Value;
            }

            if (dto.ProductId.HasValue)
            {
                var product = await _context.Products.FindAsync(dto.ProductId.Value);
                if (product == null) return NotFound();
                newProductId = dto.ProductId.Value;
            }

            if (dto.UserId.HasValue || dto.ProductId.HasValue)
            {
                var duplicate = await _context.Wishlists.AnyAsync(w => w.UserId == newUserId && w.ProductId == newProductId && w.WishlistId != id);
                if (duplicate) return Conflict();
            }

            if (dto.UserId.HasValue) entity.UserId = newUserId;
            if (dto.ProductId.HasValue) entity.ProductId = newProductId;
            if (dto.AddedDate.HasValue) entity.AddedDate = dto.AddedDate.Value;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WishlistExists(id))
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

        // POST: api/Wishlists
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Wishlist>> PostWishlist(WishlistCreateDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
            {
                return NotFound();
            }

            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null)
            {
                return NotFound();
            }

            var exists = await _context.Wishlists.AnyAsync(w => w.UserId == dto.UserId && w.ProductId == dto.ProductId);
            if (exists)
            {
                return Conflict();
            }

            var entity = new Wishlist
            {
                UserId = dto.UserId,
                ProductId = dto.ProductId
            };

            _context.Wishlists.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetWishlist", new { id = entity.WishlistId }, entity);
        }

        // DELETE: api/Wishlists/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWishlist(int id)
        {
            var wishlist = await _context.Wishlists.FindAsync(id);
            if (wishlist == null)
            {
                return NotFound();
            }

            _context.Wishlists.Remove(wishlist);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool WishlistExists(int id)
        {
            return _context.Wishlists.Any(e => e.WishlistId == id);
        }
    }
}
