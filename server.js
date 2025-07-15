// backend-node/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
console.log("✅ SMTP_USER:", process.env.SMTP_USER);
console.log("✅ SMTP_PASS:", process.env.SMTP_PASS ? "Loaded" : "Missing");

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// GEMINI PITCH GENERATOR
app.post("/generate", async (req, res) => {
  console.log("📩 /generate called");

  const { event, company, senderType = "student", userDetails = {} } = req.body;

  if (!event || !company) {
    return res.status(400).json({ error: "Missing event or company in request." });
  }

  const userName = userDetails.name;
  const userTitle = userDetails.title;
  const userOrganization = userDetails.organization;

  let prompt = "";

  if (senderType === "company") {
    // Company reaching out to student organizer
    prompt = `
Act as a representative of a company interested in collaborating with a college event.
Write a professional, warm, and concise email from a company to a student organizer, offering potential sponsorship or partnership.

Avoid using square brackets or placeholders. Use realistic defaults if anything is missing.

Details:

Event:
- Title: ${event.title || "Campus Fest 2025"}
- Description: ${event.description || "A vibrant student event featuring games, music, and workshops"}
- Expected Sponsorship: ₹${event.expectedSponsorshipAmount || "25000"}
- Estimated Attendees: ${event.estimatedAttendees || "200+"}
- Contact Date: ${event.contactDate || "20th August 2025"}
- Contact Location: ${event.contactLocation || "Main Auditorium, XYZ University"}

Student Organizer:
- Name: ${userName || "Abhinav Mangalore"}
- Title: ${userTitle || "Campus Co-Lead"}
- Organization: ${userOrganization || "DSEU"}

Company:
- Name: ${company.name || "EventoCrat"}
- Industry: ${company.industry || "Marketing"}
- Contact Person: ${company.contactPersonName || "Sponsorship Manager"}

Tone: warm, collaborative, and professional.
    `;
  } else {
    // Default: student sending to company
    prompt = `
Act as an expert in sponsorship outreach for college events.
Write a short, polite, and convincing email from a student at a college to a company, requesting sponsorship.

🚫 Do NOT include introductory text like "Here's a sample email" or "Subject:"
✅ Only return the actual email body as plain text.
❌ Do NOT include ANY square brackets or placeholders. Use realistic defaults if any information is missing.

Event:
- Title: ${event.title || "Campus Fest 2025"}
- Description: ${event.description || "A vibrant student event featuring games, music, and workshops"}
- Expected Sponsorship: ₹${event.expectedSponsorshipAmount || "25000"}
- Estimated Attendees: ${event.estimatedAttendees || "200+"}
- Contact Date: ${event.contactDate || "20th August 2025"}
- Contact Location: ${event.contactLocation || "Main Auditorium, XYZ University"}

Organizer:
- Name: ${userName || "Abhinav Mangalore"}
- Title: ${userTitle || "Campus Co-Lead"}
- Organization: ${userOrganization || "DSEU"}

Company:
- Name: ${company.name || "EventoCrat"}
- Industry: ${company.industry || "Marketing"}
- Budget Range: ₹${company.budgetRange?.min || 10000} - ₹${company.budgetRange?.max || 20000}
- Contact Person: ${company.contactPersonName || "Sponsorship Manager"}

Tone: warm, confident, and professional.
    `;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const processedText = text
      .replace(/\[Your Name\]/gi, userName || "User Name")
      .replace(/\[Your Title\]/gi, userTitle || "User Title")
      .replace(/\[College Name\]/gi, userOrganization || "Sample Organization")
      .replace(/\[Student's Name\]/gi, userName || "User Name")
      .replace(/\[Student's Phone Number\]/gi, "9876543210")
      .replace(/\[Student's Email Address\]/gi, "johndoe@gmail.com")
      .replace(/\[University Name\]/gi, userOrganization || "Sample Organization")
      .replace(/\[Your Email Address\]/gi, "org@gmail.com")
      .replace(/\[Your Phone Number\]/gi, "9876543210")
      .replace(/\[Contact Person Name at EventoCrat\]/gi, company.contactPersonName || "Sponsorship Manager")
      .replace(/\[.*?\]/g, "");

    res.json({ pitch: processedText });
  } catch (error) {
    console.error("❌ Gemini Error:", error);
    res.status(500).json({ error: "Failed to generate pitch." });
  }
});

// SMTP MAIL SENDER
app.post("/send-email", async (req, res) => {
  console.log("🔥 Sending email to:", req.body);
  const { to, subject, text, fromName, replyTo } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      replyTo,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email sent successfully!" });
  } catch (err) {
    console.error("❌ Email Error:", err);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ Gemini backend running on http://localhost:${PORT}`);
});
