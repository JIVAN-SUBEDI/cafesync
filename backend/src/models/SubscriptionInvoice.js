const BaseModel = require('./BaseModel');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class SubscriptionInvoice extends BaseModel {
  constructor() {
    super('subscription_invoices');
  }

  async generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `INV-${year}${month}${day}-${random}`;
  }

  async createInvoice(hotelId, planId, amount, periodStart, periodEnd) {
    const invoiceData = {
      hotel_id: hotelId,
      subscription_plan_id: planId,
      invoice_number: await this.generateInvoiceNumber(),
      amount,
      status: 'pending',
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    return await this.create(invoiceData);
  }

  async markAsPaid(invoiceId, paymentMethod, transactionId) {
    return await this.update(invoiceId, {
      status: 'paid',
      paid_at: new Date(),
      payment_method: paymentMethod,
      transaction_id: transactionId
    });
  }

  async getHotelInvoices(hotelId, limit = 20, offset = 0) {
    const query = `
      SELECT 
        si.*,
        sp.plan_name
      FROM subscription_invoices si
      LEFT JOIN subscription_plans sp ON si.subscription_plan_id = sp.id
      WHERE si.hotel_id = $1
      ORDER BY si.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [hotelId, limit, offset]);
    return result.rows;
  }

  async getPendingInvoices() {
    const query = `
      SELECT 
        si.*,
        h.hotel_name,
        h.hotel_slug,
        h.registered_user_id,
        ru.email as user_email
      FROM subscription_invoices si
      JOIN hotels h ON si.hotel_id = h.id
      JOIN registered_users ru ON h.registered_user_id = ru.id
      WHERE si.status = 'pending'
      AND si.due_date >= CURRENT_DATE
      ORDER BY si.due_date ASC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = new SubscriptionInvoice();