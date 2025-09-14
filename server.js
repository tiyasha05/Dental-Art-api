import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

const allowedOrigins = [
  "https://dentalartdelhi.com",   // ✅ Production
  "https://www.dentalartdelhi.com", // ✅ Add this too
  "http://localhost:5173",       // ✅ Local Devv
];

// For ES module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(bodyParser.json());
console.log("✅ Middleware initialized");

// ✅ Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/* =========================
   📌 Appointment API
========================= */
app.post("/api/appointment", async (req, res) => {
  console.log("📥 Received Appointment Request");
  console.log("➡️ Payload:", req.body);

  const { name, phone, treatment, doctor, date, timeHour, timePeriod } = req.body;

  if (!name || !phone || !treatment || !doctor || !date || !timeHour || !timePeriod) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    // Excel file
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Appointments");
    sheet.columns = [
      { header: "Name", key: "name" },
      { header: "Phone", key: "phone" },
      { header: "Treatment", key: "treatment" },
      { header: "Doctor", key: "doctor" },
      { header: "Date", key: "date" },
      { header: "Time", key: "time" },
      { header: "Submitted At", key: "submittedAt" },
    ];
    sheet.addRow({
      name,
      phone,
      treatment,
      doctor,
      date,
      time: `${timeHour} ${timePeriod}`,
      submittedAt: new Date().toLocaleString(),
    });
    const buffer = await workbook.xlsx.writeBuffer();
    console.log("✅ Excel file created");

    // Send with Resend
    await resend.emails.send({
      from: "Appointments <appointments@dentalartdelhi.com>",// 👈 replace with verified sender
      to: "drtarakhilnanidentalart@gmail.com",
      subject: "🦷 New Appointment Booking",
      html: `
        <h2>New Appointment</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Treatment:</strong> ${treatment}</p>
        <p><strong>Doctor:</strong> ${doctor}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${timeHour} ${timePeriod}</p>
      `,
      attachments: [
        {
          filename: "appointment.xlsx",
          content: buffer.toString("base64"), // must be base64 for Resend
        },
      ],
    });

    console.log("✅ Appointment email sent via Resend");
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error sending appointment:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =========================
   📌 Contact API
========================= */
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    await resend.emails.send({
      from: "Contacts <info@dentalartdelhi.com>", // 👈 replace with verified sender
      to: "drtarakhilnanidentalart@gmail.com",
      subject: "📬 New Contact Form Submission",
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong><br/> ${message}</p>
      `,
    });

    console.log(`✅ Contact form email sent via Resend from ${name}`);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Email sending error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =========================
   🌐 Serve Frontend
========================= */
const clientPath = path.join(__dirname, "dist");
console.log("📦 Serving static frontend from:", clientPath);
app.use(express.static(clientPath));

app.get("/*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

/* =========================
   🚀 Start Server
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
