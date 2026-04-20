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
  debug: true,
  logger: true
});

// =========================
// LOW STOCK EMAIL
// =========================
export const sendLowStockEmail = async (products) => {
  try {
    if (!products || !products.length) return;

    const productList = products.map(p => {
      const isCritical = p.quantity_available <= (p.min_stock * 0.2); // Less than 20% of min stock
      const badgeStyle = isCritical 
        ? "background-color: #fee2e2; color: #dc2626;" 
        : "background-color: #fef3c7; color: #d97706;";
      const badgeText = isCritical ? "CRITICAL" : "LOW";

      return `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 600; color: #1e293b; font-size: 14px;">${p.name}</div>
          </td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #475569;">${p.quantity_available}</span>
          </td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <span style="color: #64748b;">${p.min_stock}</span>
          </td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
            <span style="padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; ${badgeStyle}">
              ${badgeText}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 40px 10px;">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #4f46e5; padding: 32px; text-align: center;">
                    <div style="background-color: rgba(255, 255, 255, 0.2); width: 48px; height: 48px; border-radius: 12px; display: inline-block; line-height: 48px; margin-bottom: 16px;">
                      <span style="font-size: 24px;">⚠️</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Low Stock Alert</h1>
                    <p style="margin: 8px 0 0; color: #e0e7ff; font-size: 16px;">Action required for ${products.length} product(s)</p>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.5;">
                      The following items have fallen below their minimum stock thresholds. Please review and restock these items to avoid service disruption.
                    </p>
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                      <thead>
                        <tr style="background-color: #f1f5f9;">
                          <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Product</th>
                          <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Stock</th>
                          <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Min</th>
                          <th style="padding: 12px 16px; text-align: right; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${productList}
                      </tbody>
                    </table>
                    
                    <!-- CTA -->
                    <div style="margin-top: 32px; text-align: center;">
                      <a href="${process.env.FRONTEND_URL || "#"}/inventory" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                        Manage Inventory
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                      This is an automated notification from your Inventory Management System.
                    </p>
                    <div style="margin-top: 12px;">
                      <a href="#" style="color: #6366f1; text-decoration: none; font-size: 12px; font-weight: 600;">System Settings</a>
                      <span style="color: #cbd5e1; margin: 0 8px;">&bull;</span>
                      <a href="#" style="color: #6366f1; text-decoration: none; font-size: 12px; font-weight: 600;">Support Center</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"Inventory System" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `⚠️ Low Stock Alert: ${products.length} items require attention`,
      html: htmlContent,
      priority: "high"
    });

    console.log("📧 Low stock email sent:", info.messageId);

  } catch (err) {
    console.error("❌ Failed to send low stock email:", err.message);
  }
};