import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from backend directory
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Email service endpoint
app.post('/api/send-fee-email', async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const {
      to,
      studentName,
      month,
      year,
      totalAmount,
      paidAmount,
      dueAmount,
      status,
      receiptNumber,
      createdAt,
      portalLink,
      schoolName,
      schoolAddress,
      schoolContact,
      schoolEmail,
    } = req.body || {};

    if (!process.env.RESEND_API_KEY) {
      res.status(500).json({ error: "RESEND_API_KEY is not configured" });
      return;
    }

    if (!to) {
      res.status(400).json({ error: "Missing recipient email (to)" });
      return;
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "School <onboarding@resend.dev>";

    const formatMoney = (value) => {
      const n = Number(value);
      if (Number.isNaN(n)) return "0";
      return n.toLocaleString("en-IN");
    };

    const escapeHtml = (unsafe) => {
      return String(unsafe ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    };

    const buildEmailHtml = ({
      studentName,
      month,
      year,
      totalAmount,
      paidAmount,
      dueAmount,
      status,
      receiptNumber,
      createdAt,
      portalLink,
      schoolName,
      schoolAddress,
      schoolContact,
      schoolEmail,
    }) => {
      const due = Number(dueAmount);
      const dueLine = due > 0 ? `₹${formatMoney(due)}` : "No Due Amount";

      return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
      <p>Dear ${escapeHtml(studentName)},</p>

      <p>
        This is to inform you that the <strong>fee details for the month of ${escapeHtml(
          month
        )} ${escapeHtml(year)}</strong> have been successfully added to your account.
      </p>

      <p>Below are the fee details:</p>

      <div style="background:#f7f7f7;border:1px solid #e5e5e5;border-radius:8px;padding:12px 14px;max-width:560px">
        <p style="margin:6px 0"><strong>📅 Fee Month &amp; Year:</strong> ${escapeHtml(
          month
        )} ${escapeHtml(year)}</p>
        <p style="margin:6px 0"><strong>💰 Total Fee Amount:</strong> ₹${formatMoney(
          totalAmount
        )}</p>
        <p style="margin:6px 0"><strong>💳 Paid Amount:</strong> ₹${formatMoney(
          paidAmount
        )}</p>
        <p style="margin:6px 0"><strong>⏳ Due Amount:</strong> ${dueLine}</p>
        <p style="margin:6px 0"><strong>📌 Payment Status:</strong> ${escapeHtml(
          status
        )}</p>
        <p style="margin:6px 0"><strong>🧾 Receipt Number:</strong> ${escapeHtml(
          receiptNumber || "-"
        )}</p>
        <p style="margin:6px 0"><strong>🗓️ Record Created On:</strong> ${escapeHtml(
          createdAt
        )}</p>
      </div>

      <p>
        If there is any due amount, kindly ensure timely payment to avoid late fees or inconvenience.
      </p>

      <p>
        For detailed information or to download the receipt, please log in to the school portal.
      </p>

      <p>
        🔗 <strong>School Portal:</strong> <a href="${escapeHtml(
          portalLink
        )}" target="_blank" rel="noreferrer">${escapeHtml(portalLink)}</a>
      </p>

      <p>If you have already completed the payment, please ignore this message.</p>

      <p style="margin-top:18px">
        Thank you for your cooperation.<br />
        Warm regards,<br />
        <strong>${escapeHtml(schoolName)}</strong><br />
        📍 ${escapeHtml(schoolAddress)}<br />
        📞 ${escapeHtml(schoolContact)}<br />
        ✉️ ${escapeHtml(schoolEmail)}
      </p>
    </div>
    `;
    };

    const subject = `Fee Details Added: ${month} ${year}`;

    const html = buildEmailHtml({
      studentName: studentName || "Student",
      month: month || "",
      year: year || "",
      totalAmount: totalAmount ?? 0,
      paidAmount: paidAmount ?? 0,
      dueAmount: dueAmount ?? 0,
      status: status || "pending",
      receiptNumber,
      createdAt: createdAt || new Date().toISOString(),
      portalLink: portalLink || process.env.SCHOOL_PORTAL_LINK || "",
      schoolName: schoolName || process.env.SCHOOL_NAME || "Demo Public School",
      schoolAddress: schoolAddress || process.env.SCHOOL_ADDRESS || "",
      schoolContact: schoolContact || process.env.SCHOOL_CONTACT || "",
      schoolEmail: schoolEmail || process.env.SCHOOL_EMAIL || "",
    });

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      res.status(500).json({ error: error.message || "Failed to send email" });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Unknown error" });
  }
});

// Generic database operations
app.post('/api/database/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { operation, data, filters } = req.body;

    let result;
    switch (operation) {
      case 'select':
        result = await supabase
          .from(table)
          .select('*')
          .match(filters || {});
        break;
      case 'insert':
        result = await supabase
          .from(table)
          .insert(data);
        break;
      case 'update':
        result = await supabase
          .from(table)
          .update(data)
          .match(filters || {});
        break;
      case 'delete':
        result = await supabase
          .from(table)
          .delete()
          .match(filters || {});
        break;
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({ data: result.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
