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
    public class TagsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public TagsController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/Tags
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Tag>>> GetTags()
        {
            return await _context.Tags.ToListAsync();
        }

        // GET: api/Tags/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Tag>> GetTag(int id)
        {
            var tag = await _context.Tags.FindAsync(id);

            if (tag == null)
            {
                return NotFound();
            }

            return tag;
        }

        // PUT: api/Tags/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTag(int id, TagUpdateDto dto)
        {
            var existing = await _context.Tags.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            var name = dto.TagName?.Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new { message = "TagName is required" });
            }

            var duplicate = await _context.Tags.AnyAsync(t => t.TagName == name && t.TagId != id);
            if (duplicate)
            {
                return Conflict(new { message = "TagName already exists" });
            }

            existing.TagName = name;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TagExists(id))
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

        // POST: api/Tags
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Tag>> PostTag(TagCreateDto dto)
        {
            var name = dto.TagName?.Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new { message = "TagName is required" });
            }

            var exists = await _context.Tags.AnyAsync(t => t.TagName == name);
            if (exists)
            {
                return Conflict(new { message = "TagName already exists" });
            }

            var tag = new Tag { TagName = name };
            _context.Tags.Add(tag);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTag", new { id = tag.TagId }, tag);
        }

        // DELETE: api/Tags/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTag(int id)
        {
            var tag = await _context.Tags.FindAsync(id);
            if (tag == null)
            {
                return NotFound();
            }

            _context.Tags.Remove(tag);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TagExists(int id)
        {
            return _context.Tags.Any(e => e.TagId == id);
        }
    }
}
