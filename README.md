# Eventocrat Backend

A Node.js/Express backend for Eventocrat that handles AI-based pitch generation (via Gemini API) and proposal email delivery (via SMTP using Nodemailer).

## 🌐 Live Endpoint

🔗 https://eventocrat-backend.onrender.com/

## 📦 Tech Stack

- Express.js
- Google Generative AI SDK
- Nodemailer (Gmail SMTP)
- dotenv for env config
- CORS enabled

## 📁 Folder Structure
backend-node/
├── server.js # Main Express API logic
├── package.json
└── .env # Environment variables


## 🔐 Environment Variables

Create a `.env` file inside `backend-node/`:

GEMINI_API_KEY=your_gemini_api_key
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_password


> Use Gmail with "App Passwords" enabled for security.

## 🛠️ API Endpoints

### POST `/generate`

Generates a sponsorship pitch using Google Gemini.

**Body:**

```json
{
  "event": { ... },
  "company": { ... },
  "senderType": "student" | "company"
}
```

### POST `/send-email`
Sends the generated pitch as an email to the receiver.

Body:
```json
{
  "to": "receiver@example.com",
  "subject": "Sponsorship Opportunity",
  "text": "Generated pitch message here",
  "fromName": "Sender's Name or Email",
  "replyTo": "sender@example.com"
}
```

## 🧪 Local Development
```bash
git clone https://github.com/yourusername/eventocrat-backend.git
cd eventocrat-backend
npm install
npm run dev
```

## 🌐 Deployment
Deployed on Render with auto-restart on failure.

## 📄 License
MIT License
