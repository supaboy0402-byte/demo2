using System.Security.Cryptography;
using System.Text;

namespace api2.Services;

public static class SimpleToken
{
    private static string GetSecret()
    {
        var env = Environment.GetEnvironmentVariable("AUTH_TOKEN_SECRET");
        return string.IsNullOrEmpty(env) ? "dev_secret_change_me" : env;
    }

    private static string ToBase64Url(byte[] bytes) => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    private static byte[] FromBase64Url(string s)
    {
        s = s.Replace('-', '+').Replace('_', '/');
        switch (s.Length % 4)
        {
            case 2: s += "=="; break;
            case 3: s += "="; break;
        }
        return Convert.FromBase64String(s);
    }

    public static string Encode(int userId, DateTime expiresUtc)
    {
        var payload = $"{userId}:{new DateTimeOffset(expiresUtc).ToUnixTimeSeconds()}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(GetSecret()));
        var sig = ToBase64Url(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
        var token = ToBase64Url(Encoding.UTF8.GetBytes(payload)) + "." + sig;
        return token;
    }

    public static bool TryDecode(string token, out int userId)
    {
        userId = 0;
        if (string.IsNullOrWhiteSpace(token)) return false;
        var parts = token.Split('.');
        if (parts.Length != 2) return false;
        var payloadBytes = FromBase64Url(parts[0]);
        var payload = Encoding.UTF8.GetString(payloadBytes);
        var expectedSig = parts[1];
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(GetSecret()));
        var actualSig = ToBase64Url(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
        if (!string.Equals(actualSig, expectedSig, StringComparison.Ordinal)) return false;
        var segs = payload.Split(':');
        if (segs.Length != 2) return false;
        if (!int.TryParse(segs[0], out userId)) return false;
        if (!long.TryParse(segs[1], out var exp)) return false;
        var expUtc = DateTimeOffset.FromUnixTimeSeconds(exp).UtcDateTime;
        if (DateTime.UtcNow > expUtc) return false;
        return true;
    }
}
