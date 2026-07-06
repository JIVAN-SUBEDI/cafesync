const db = require('../config/database.js');

function isValidSlug(slug) {
  return /^[a-z0-9-]{2,100}$/.test(slug);
}

async function checkTenantSlug(req, res, next) {
  try {
    const slugRaw = req.params.slug || "";
    const slug = slugRaw.trim().toLowerCase();

    if (!slug) {
      return res.status(400).json({ ok: false, exists: false, message: "Slug is required" });
    }
    console.log('this is the slug:- ', slug)

    if (!isValidSlug(slug)) {
      console.log('error is the slug:- ', slug)
      return res.status(400).json({ ok: false, exists: false, message: "Invalid slug format" });
    }
console.log('running ')
    const pool = db;

    // Matches your schema: hotels(hotel_slug unique)
    const { rows } = await pool.query(
      `
      SELECT id, hotel_name, hotel_slug, is_active, subscription_status
      FROM hotels
      WHERE hotel_slug = $1
      LIMIT 1
      `,
      [slug]
    );

    if (rows.length === 0) {
      return res.json({ ok: true, exists: false });
    }

    const hotel = rows[0];

    // Optional rule: only allow active hotels
    if (!hotel.is_active) {
      return res.json({ ok: true, exists: false, message: "Hotel is inactive" });
    }

    // Optional rule: block suspended/cancelled
    // if (["suspended", "cancelled"].includes(hotel.subscription_status)) {
    //   return res.json({ ok: true, exists: false, message: "Subscription not active" });
    // }

    return res.json({
      ok: true,
      exists: true,
      hotel: {
        id: hotel.id,
        name: hotel.hotel_name,
        slug: hotel.hotel_slug,
        subscription_status: hotel.subscription_status,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkTenantSlug };
