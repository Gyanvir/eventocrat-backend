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
  const { event, company, senderType = "student" } = req.body;

  if (!event || !company) {
    return res.status(400).json({ error: "Missing event or company in request." });
  }

  let prompt = "";

  if (senderType === "company") {
    // Company sending to student
    prompt = `
Act as an expert brand partnership strategist.
Help a company write a professional message offering sponsorship to a college event.

Company:
- Name: ${company.name}
- Industry: ${company.industry}
- Budget Range: ₹${company.budgetRange.min} - ₹${company.budgetRange.max}

Event:
- Title: ${event.title}
- Description: ${event.description}
- Expected Sponsorship: ₹${event.expectedSponsorshipAmount}

Write a polite and attractive sponsorship offer email.
    `;
  } else {
    // Default: student sending to company
    prompt = `
Act as an expert in sponsorship outreach for college events.
Help the student write a professional sponsorship email.

Event:
- Title: ${event.title}
- Description: ${event.description}
- Expected Sponsorship: ₹${event.expectedSponsorshipAmount}

Company:
- Name: ${company.name}
- Industry: ${company.industry}
- Budget Range: ₹${company.budgetRange.min} - ₹${company.budgetRange.max}

Write a short, polite and convincing sponsorship pitch.
    `;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ pitch: text });
  } catch (error) {
    console.error("❌ Gemini Error:", error);
    res.status(500).json({ error: "Failed to generate pitch." });
  }
});

// SMTP MAIL SENDER
app.post("/send-email", async (req, res) => {
  const { to, subject, text, fromName, replyTo } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,      // e.g. eventocrat@gmail.com
        pass: process.env.SMTP_PASS,      // app password
      },
    });
    console.log("📧 Sending email to:", to);
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
