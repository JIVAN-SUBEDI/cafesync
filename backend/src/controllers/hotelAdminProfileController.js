// Update current hotel profile
const db = require("../config/database");

exports.updateMyHotelProfile = async (req, res, next) => {
  try {
    const hotelId = req.hotel?.id || req.hotelId;

    if (!hotelId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      hotel_name,
      hotel_phone,
      hotel_address,
      city,
      country,
      timezone,
      currency,
      tax_rate,
      service_charge,
    } = req.body;

    const allowedCurrencies = ["USD", "NPR", "INR","AED","EUR","GBP"];
    const safeCurrency =
      currency && allowedCurrencies.includes(currency) ? currency : undefined;

    const parsedTaxRate =
      tax_rate !== undefined && tax_rate !== null
        ? Number(tax_rate)
        : undefined;
    const parsedServiceCharge =
      service_charge !== undefined && service_charge !== null
        ? Number(service_charge)
        : undefined;

    if (
      parsedTaxRate !== undefined &&
      (Number.isNaN(parsedTaxRate) ||
        parsedTaxRate < 0 || parsedTaxRate > 100)
    ) {
      return res.status(422).json({
        success: false,
        message: "Tax rate must be between 0 and 1 askbfahdkjahssd",
      });
    }

    if (
      parsedServiceCharge !== undefined &&
      (Number.isNaN(parsedServiceCharge) ||
        parsedServiceCharge < 0 || parsedServiceCharge > 100)
    ) {
      return res.status(422).json({
        success: false,
        message: "Service charge must be between 0 and 1",
      });
    }

    const existing = await db.query(
      `SELECT id, hotel_name, hotel_slug, hotel_phone, hotel_address,
              city, country, timezone, currency, tax_rate, service_charge,
              subscription_status, subscription_plan_id, subscription_end_date,
              is_active, is_verified, created_at, updated_at
       FROM hotels
       WHERE id = $1
       LIMIT 1`,
      [hotelId],
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const result = await db.query(
      `
      UPDATE hotels
      SET
        hotel_name = COALESCE($1, hotel_name),
        hotel_phone = COALESCE($2, hotel_phone),
        hotel_address = COALESCE($3, hotel_address),
        city = COALESCE($4, city),
        country = COALESCE($5, country),
        timezone = COALESCE($6, timezone),
        currency = COALESCE($7, currency),
        tax_rate = COALESCE($8, tax_rate),
        service_charge = COALESCE($9, service_charge),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING
        id,
        hotel_name,
        hotel_slug,
 
        hotel_phone,
        hotel_address,
        city,
        country,
        timezone,
        currency,
        tax_rate,
        service_charge,
        subscription_status,
        subscription_plan_id,
        subscription_end_date,
        is_active,
        is_verified,
        created_at,
        updated_at
      `,
      [
        hotel_name ?? null,
        hotel_phone ?? null,
        hotel_address ?? null,
        city ?? null,
        country ?? null,
        timezone ?? null,
        safeCurrency ?? null,
        parsedTaxRate ?? null,
        parsedServiceCharge ?? null,
        hotelId,
      ],
    );

    await db.query(
      `
      INSERT INTO activity_logs (
        user_id,
        user_type,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, NOW())
      `,
      [
        hotelId,
        "hotel_admin",
        "UPDATE_HOTEL_PROFILE",
        "hotel",
        hotelId,
        JSON.stringify({
          before: existing.rows[0],
          after: result.rows[0],
        }),
        req.ip,
        req.headers["user-agent"] || null,
      ],
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      hotel: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
