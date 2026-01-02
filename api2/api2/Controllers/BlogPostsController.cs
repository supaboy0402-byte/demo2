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
    public class BlogPostsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public BlogPostsController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        // GET: api/BlogPosts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BlogPost>>> GetBlogPosts()
        {
            return await _context.BlogPosts.Include(b => b.Author).ToListAsync();
        }

        // GET: api/BlogPosts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<BlogPost>> GetBlogPost(int id)
        {
            var blogPost = await _context.BlogPosts.Include(b => b.Author).FirstOrDefaultAsync(b => b.BlogId == id);

            if (blogPost == null)
            {
                return NotFound();
            }

            return blogPost;
        }

        [HttpGet("slug/{slug}")]
        public async Task<ActionResult<BlogPost>> GetBlogPostBySlug(string slug)
        {
            var blogPost = await _context.BlogPosts.Include(b => b.Author).FirstOrDefaultAsync(b => b.Slug == slug);
            if (blogPost == null)
            {
                return NotFound();
            }
            return blogPost;
        }

        // PUT: api/BlogPosts/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBlogPost(int id, [FromBody] BlogPostUpdateDto dto)
        {
            var entity = await _context.BlogPosts.FindAsync(id);
            if (entity == null)
            {
                return NotFound();
            }

            if (dto.Title != null) entity.Title = dto.Title;
            if (dto.Slug != null) entity.Slug = dto.Slug;
            if (dto.Content != null) entity.Content = dto.Content;
            if (dto.FeaturedImage != null) entity.FeaturedImage = dto.FeaturedImage;
            if (dto.AuthorId.HasValue) entity.AuthorId = dto.AuthorId.Value;
            if (dto.PublishedDate.HasValue) entity.PublishedDate = dto.PublishedDate.Value;
            if (dto.Status.HasValue) entity.Status = dto.Status.Value;
            if (dto.MetaDescription != null) entity.MetaDescription = dto.MetaDescription;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BlogPostExists(id))
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

        // POST: api/BlogPosts
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<BlogPost>> PostBlogPost([FromBody] BlogPostCreateDto dto)
        {
            var entity = new BlogPost
            {
                Title = dto.Title,
                Slug = dto.Slug,
                Content = dto.Content,
                FeaturedImage = dto.FeaturedImage,
                AuthorId = dto.AuthorId,
                PublishedDate = dto.PublishedDate,
                Status = dto.Status ?? 0,
                MetaDescription = dto.MetaDescription
            };

            _context.BlogPosts.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetBlogPost", new { id = entity.BlogId }, entity);
        }

        // DELETE: api/BlogPosts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBlogPost(int id)
        {
            var blogPost = await _context.BlogPosts.FindAsync(id);
            if (blogPost == null)
            {
                return NotFound();
            }

            _context.BlogPosts.Remove(blogPost);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BlogPostExists(int id)
        {
            return _context.BlogPosts.Any(e => e.BlogId == id);
        }
    }
}
