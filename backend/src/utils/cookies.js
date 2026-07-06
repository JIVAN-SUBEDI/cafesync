// utils/cookies.js
const isProd = process.env.NODE_ENV === "production";

function cookieOptionsBase() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: process.env.NODE_ENV=== 'production' ? 'none' : 'lax',
    path: "/",
  };
}

function setAuthCookies(res, accessToken, refreshToken) {
  const base = cookieOptionsBase();

  // Access token - available everywhere
  res.cookie("admin_access", accessToken, {
    ...base,
    maxAge: 5 * 60 * 1000, // 5 min
  });

  // Refresh token - also available everywhere (but only used by refresh endpoint)
  res.cookie("admin_refresh", refreshToken, {
    ...base,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    // Remove path restriction so it's sent with all requests
  });
}

function clearAuthCookies(res) {
  const base = cookieOptionsBase();
  res.clearCookie("admin_access", base);
  console.log("Clearing refresh cookie with options:", base);
  res.clearCookie("admin_refresh", base);
  console.log("Cookies cleared");
}

module.exports = { setAuthCookies, clearAuthCookies };