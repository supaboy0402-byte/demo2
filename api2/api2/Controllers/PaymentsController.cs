﻿﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;
using api2.Models;
using api2.DTOs;

namespace api2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly MusicStoreDbFinal2Context _context;
        private readonly IConfiguration _config;

        public PaymentsController(MusicStoreDbFinal2Context context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // GET: api/Payments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Payment>>> GetPayments()
        {
            return await _context.Payments.ToListAsync();
        }

        // GET: api/Payments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetPayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);

            if (payment == null)
            {
                return NotFound();
            }

            return payment;
        }

        // PUT: api/Payments/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPayment(int id, PaymentUpdateDto dto)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound();
            }

            if (dto.OrderId.HasValue) payment.OrderId = dto.OrderId.Value;
            if (dto.Amount.HasValue) payment.Amount = dto.Amount.Value;
            if (dto.PaymentMethod.HasValue) payment.PaymentMethod = dto.PaymentMethod.Value;
            if (dto.Status.HasValue) payment.Status = dto.Status.Value;
            if (dto.TransactionRef != null) payment.TransactionRef = dto.TransactionRef;
            if (dto.PaidAt.HasValue) payment.PaidAt = dto.PaidAt.Value;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymentExists(id))
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

        // POST: api/Payments
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Payment>> PostPayment(PaymentCreateDirectDto dto)
        {
            var payment = new Payment
            {
                OrderId = dto.OrderId,
                Amount = dto.Amount,
                PaymentMethod = dto.PaymentMethod,
                Status = dto.Status,
                TransactionRef = dto.TransactionRef,
                PaidAt = dto.PaidAt
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetPayment", new { id = payment.PaymentId }, payment);
        }

        // DELETE: api/Payments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound();
            }

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PaymentExists(int id)
        {
            return _context.Payments.Any(e => e.PaymentId == id);
        }

        public class MomoCreateDto
        {
            public string OrderCode { get; set; } = string.Empty;
            public decimal Amount { get; set; }
        }

        [HttpPost("momo/create")]
        public async Task<IActionResult> CreateMomoPayment(MomoCreateDto dto)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderCode == dto.OrderCode);
            if (order == null) return NotFound();

            var partnerCode = _config["Momo:PartnerCode"] ?? Environment.GetEnvironmentVariable("MOMO_PARTNER_CODE") ?? string.Empty;
            var accessKey = _config["Momo:AccessKey"] ?? Environment.GetEnvironmentVariable("MOMO_ACCESS_KEY") ?? string.Empty;
            var secretKey = _config["Momo:SecretKey"] ?? Environment.GetEnvironmentVariable("MOMO_SECRET_KEY") ?? string.Empty;
            var redirectBase = _config["Momo:RedirectUrl"] ?? Environment.GetEnvironmentVariable("MOMO_REDIRECT_URL") ?? "http://localhost:3000/checkout/success";
            var ipnUrl = _config["Momo:IpnUrl"] ?? Environment.GetEnvironmentVariable("MOMO_IPN_URL") ?? "http://localhost:5077/api/Payments/momo/ipn";
            if (string.IsNullOrWhiteSpace(partnerCode) || string.IsNullOrWhiteSpace(accessKey) || string.IsNullOrWhiteSpace(secretKey)) return Problem("Thiếu cấu hình MoMo", statusCode: StatusCodes.Status500InternalServerError);

            var requestId = Guid.NewGuid().ToString();
            var orderId = dto.OrderCode + "-" + DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var amount = ((long)Math.Round(dto.Amount)).ToString();
            var orderInfo = "Thanh toan don " + dto.OrderCode;
            var requestType = "captureWallet";
            var extraData = string.Empty;

            var redirectUrl = redirectBase + (redirectBase.Contains("?") ? "&" : "?") + "order=" + dto.OrderCode;
            var rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
            var signature = BitConverter.ToString(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawSignature))).Replace("-", string.Empty).ToLowerInvariant();

            var payload = new
            {
                partnerCode,
                accessKey,
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                requestType,
                extraData,
                signature
            };

            using var client = new HttpClient();
            var req = new HttpRequestMessage(HttpMethod.Post, "https://test-payment.momo.vn/v2/gateway/api/create");
            req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var res = await client.SendAsync(req);
            var text = await res.Content.ReadAsStringAsync();
            var json = JsonSerializer.Deserialize<JsonElement>(text);
            var payUrl = json.TryGetProperty("payUrl", out var p) ? p.GetString() : null;
            var deeplink = json.TryGetProperty("deeplink", out var d) ? d.GetString() : null;
            var resultCode = json.TryGetProperty("resultCode", out var rc) ? rc.GetInt32() : -1;

            var existing = await _context.Payments.FirstOrDefaultAsync(x => x.OrderId == order.OrderId && x.PaymentMethod == 2);
            if (existing == null)
            {
                existing = new Payment
                {
                    OrderId = order.OrderId,
                    Amount = dto.Amount,
                    PaymentMethod = 2,
                    Status = 0,
                    TransactionRef = orderId,
                    CreatedAt = DateTime.Now
                };
                _context.Payments.Add(existing);
            }
            else
            {
                existing.Amount = dto.Amount;
                existing.Status = 0;
                existing.TransactionRef = orderId;
            }
            await _context.SaveChangesAsync();

            if (resultCode != 0 && string.IsNullOrEmpty(payUrl)) return Problem(detail: text, statusCode: StatusCodes.Status502BadGateway);
            return Ok(new { payUrl, deeplink, orderId, requestId });
        }

        [HttpPost("momo/ipn")]
        public async Task<IActionResult> MomoIpn([FromBody] JsonElement body)
        {
            var orderId = body.TryGetProperty("orderId", out var oid) ? oid.GetString() : null;
            var orderCode = orderId != null ? orderId.Split('-').FirstOrDefault() : null;
            if (string.IsNullOrWhiteSpace(orderCode)) return BadRequest();
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderCode == orderCode);
            if (order == null) return NotFound();
            var resultCode = body.TryGetProperty("resultCode", out var rc) ? rc.GetInt32() : -1;
            var pay = await _context.Payments.FirstOrDefaultAsync(p => p.OrderId == order.OrderId && p.PaymentMethod == 2);
            if (pay == null)
            {
                pay = new Payment { OrderId = order.OrderId, Amount = order.TotalAmount, PaymentMethod = 2, Status = 0, TransactionRef = orderId, CreatedAt = DateTime.Now };
                _context.Payments.Add(pay);
            }
            if (resultCode == 0)
            {
                pay.Status = 1;
                pay.PaidAt = DateTime.Now;
            }
            else
            {
                pay.Status = 2;
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "ok" });
        }
    }
}
