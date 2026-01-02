using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api2.Models;

namespace api2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;

        public AdminController(MusicStoreDbFinal2Context context)
        {
            _context = context;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var fromStr = HttpContext.Request.Query["from"].ToString();
            var toStr = HttpContext.Request.Query["to"].ToString();
            DateTime startRange, endRange;
            if (DateTime.TryParse(fromStr, out var f) && DateTime.TryParse(toStr, out var t))
            {
                startRange = new DateTime(f.Year, f.Month, f.Day);
                endRange = new DateTime(t.Year, t.Month, t.Day).AddDays(1);
            }
            else
            {
                var now = DateTime.Now;
                var startMonth = new DateTime(now.Year, now.Month, 1);
                var nextMonth = startMonth.AddMonths(1);
                startRange = startMonth;
                endRange = nextMonth;
            }
            var duration = endRange - startRange;
            var prevStartMonth = startRange.AddTicks(-duration.Ticks);
            var prevNextMonth = endRange.AddTicks(-duration.Ticks);

            var monthOrdersQuery = _context.Orders
                .AsNoTracking()
                .Where(o => o.OrderDate >= startRange && o.OrderDate < endRange);

            var monthPaymentsQuery = _context.Payments
                .AsNoTracking()
                .Where(p => (p.PaidAt ?? p.CreatedAt) >= startRange && (p.PaidAt ?? p.CreatedAt) < endRange);

            var prevMonthPaymentsQuery = _context.Payments
                .AsNoTracking()
                .Where(p => (p.PaidAt ?? p.CreatedAt) >= prevStartMonth && (p.PaidAt ?? p.CreatedAt) < prevNextMonth);

            var monthRevenue = await monthPaymentsQuery.SumAsync(p => (decimal?)p.Amount) ?? 0m;
            var prevMonthRevenue = await prevMonthPaymentsQuery.SumAsync(p => (decimal?)p.Amount) ?? 0m;
            var monthOrdersCount = await monthOrdersQuery.CountAsync(o => o.Status != 3);
            var productsCount = await _context.Products.AsNoTracking().CountAsync();
            var customersCount = await _context.Users
                .Include(u => u.Role)
                .AsNoTracking()
                .CountAsync(u => !(u.Role != null && (
                    EF.Functions.Like(u.Role.RoleName, "%admin%") ||
                    EF.Functions.Like(u.Role.RoleName, "%staff%") ||
                    EF.Functions.Like(u.Role.RoleName, "%nhân viên%")
                )));

            var revenueDailyRaw = await _context.Payments
                .AsNoTracking()
                .Where(p => (p.PaidAt ?? p.CreatedAt) >= startRange && (p.PaidAt ?? p.CreatedAt) < endRange)
                .GroupBy(p => (p.PaidAt ?? p.CreatedAt).Date)
                .Select(g => new { date = g.Key, amount = g.Sum(p => p.Amount) })
                .OrderBy(x => x.date)
                .ToListAsync();

            var statusCountsRaw = await _context.Orders
                .AsNoTracking()
                .Where(o => o.OrderDate >= startRange && o.OrderDate < endRange)
                .GroupBy(o => o.Status)
                .Select(g => new { status = g.Key, count = g.Count() })
                .ToListAsync();

            var topProducts = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Product)
                .AsNoTracking()
                .Where(oi => oi.Order.OrderDate >= startRange && oi.Order.OrderDate < endRange && oi.Order.Status != 3)
                .GroupBy(oi => new { oi.ProductId, name = oi.Product.ProductName })
                .Select(g => new { productId = g.Key.ProductId, productName = g.Key.name, quantity = g.Sum(x => x.Quantity), revenue = g.Sum(x => x.LineTotal) })
                .OrderByDescending(x => x.revenue)
                .Take(5)
                .ToListAsync();

            var recentOrders = await _context.Orders
                .Include(o => o.User)
                .AsNoTracking()
                .OrderByDescending(o => o.OrderDate)
                .Take(10)
                .Select(o => new
                {
                    id = o.OrderId,
                    orderCode = o.OrderCode,
                    customer = (o.User != null && o.User.FullName != null && o.User.FullName != string.Empty) ? o.User.FullName : (o.User != null ? o.User.Email : "Khách vãng lai"),
                    total = o.TotalAmount,
                    status = o.Status,
                    orderDate = o.OrderDate
                })
                .ToListAsync();

            return Ok(new
            {
                stats = new
                {
                    monthRevenue,
                    prevMonthRevenue,
                    monthOrdersCount,
                    productsCount,
                    customersCount
                },
                recentOrders,
                revenueDaily = revenueDailyRaw.Select(x => new { date = x.date.ToString("yyyy-MM-dd"), amount = x.amount }),
                statusCounts = statusCountsRaw,
                topProducts
            });
        }
    }
}
