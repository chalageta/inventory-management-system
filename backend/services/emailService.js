

import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const transporter = nodemailer.createTransport({
  host: "s918.lon1.mysecurecloudhost.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true,   // 🔥 add this
  logger: true   // 🔥 add this
});

// =========================
// LOW STOCK EMAIL
// =========================
export const sendLowStockEmail = async (products) => {
  try {
    if (!products || !products.length) return;

    const productList = products.map(p => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #e2e8f0;">
          ${p.name}
        </td>
        <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:center;">
          ${p.quantity_available}
        </td>
        <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:center;">
          ${p.min_stock}
        </td>
      </tr>
    `).join('');

    const content = `
      <p>⚠️ The following products are below minimum stock level:</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:20px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:10px; text-align:left;">Product</th>
            <th style="padding:10px; text-align:center;">Available</th>
            <th style="padding:10px; text-align:center;">Min Stock</th>
          </tr>
        </thead>
        <tbody>
          ${productList}
        </tbody>
      </table>

      <p style="margin-top:20px; font-weight:bold;">
        Please restock these items as soon as possible.
      </p>
    `;

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;">
        <h2>⚠️ Low Stock Alert</h2>
        <p>${products.length} product(s) need attention</p>
        ${content}
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Inventory System" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `⚠️ Low Stock Alert (${products.length} items)`,
      html: htmlContent,
      priority: "high"
    });

    console.log("📧 Low stock email sent:", info.messageId);

  } catch (err) {
    console.error("❌ Failed to send low stock email:", err.message);
  }
};