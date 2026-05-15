import express, { json } from "express";
import cors from "cors";
import { createTransport } from "nodemailer";
import dotenv from "dotenv";

// Initialize dotenv configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(json());

// Configure Nodemailer Transporter for Brevo SMTP
const transporter = createTransport({
  host: "smtp-relay.brevo.com",
  port: 2525,
  secure: false,
  auth: {
    user: process.env.BREVO_LOGIN,
    pass: process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY,
  },
});

/**
 * @route POST /api/send-mail
 * @desc Send transactional email using Brevo
 * @access Public / Private depending on configuration
 */
app.get("/api/send-mail", (req, res) => {
  res.status(405).json({
    success: false,
    message:
      "Method Not Allowed. Please send a POST request with the required data (name, email, phone, course, message) to this endpoint.",
  });
});

const handleSendMail = async (req, res) => {
  try {
    const { name, email, phone, course, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email address are required.",
      });
    }

    const recipientEmail =
      process.env.ADMIN_EMAIL ||
      process.env.SENDER_EMAIL ||
      "erohealthcare026@gmail.com";

    const senderEmail = process.env.SENDER_EMAIL || "erohealthcare026@gmail.com";
    const senderName =
      process.env.SENDER_NAME || "Ero HealthCare Innovation Private Limited";
    const fromStr = `"${senderName}" <${senderEmail}>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .email-container {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            border: 1px solid #eaeaea;
          }
          .header {
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
          }
          .header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 30px;
            color: #4a4a4a;
            line-height: 1.6;
          }
          .content p {
            margin-top: 0;
            font-size: 16px;
            color: #666;
          }
          .info-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 25px;
          }
          .info-table th, .info-table td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
          }
          .info-table th {
            width: 35%;
            font-weight: 600;
            color: #333;
            background-color: #fafafa;
          }
          .info-table td {
            color: #555;
          }
          .info-table tr:last-child th, .info-table tr:last-child td {
            border-bottom: none;
          }
          .message-box {
            background-color: #f9fbfd;
            border-left: 4px solid #2c5364;
            padding: 15px 20px;
            margin-top: 15px;
            border-radius: 0 8px 8px 0;
            color: #444;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 13px;
            color: #888;
            border-top: 1px solid #eaeaea;
          }
        </style>
      </head>
      <body style="background-color: #f4f7f6; margin: 0; padding: 20px;">
        <div class="email-container">
          <div class="header">
            <h2>New Contact Inquiry</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have received a new message from your website contact form. Here are the details:</p>
            <table class="info-table">
              <tr>
                <th>Full Name</th>
                <td>${name}</td>
              </tr>
              <tr>
                <th>Email Address</th>
                <td><a href="mailto:${email}" style="color: #2c5364; text-decoration: none; font-weight: 500;">${email}</a></td>
              </tr>
              <tr>
                <th>Phone Number</th>
                <td>${phone || "Not Provided"}</td>
              </tr>
              <tr>
                <th>Specialty / Course</th>
                <td>${course || "Not Provided"}</td>
              </tr>
            </table>
            
            <div style="margin-top: 25px; font-weight: 600; color: #333; padding-left: 15px;">Message:</div>
            <div class="message-box">
              ${message ? message.replace(/\n/g, "<br>") : "No message provided."}
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0;">This email was sent automatically from your website. Please do not reply directly to this notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Nodemailer on Port 2525
    const info = await transporter.sendMail({
      from: fromStr,
      to: recipientEmail,
      replyTo: `"${name}" <${email}>`,
      subject: `New Inquiry from ${name} - Contact Form`,
      html: htmlContent,
    });

    return res.status(200).json({
      success: true,
      message: "Contact form submitted and email sent successfully!",
      messageId: info.messageId,
      data: info,
    });
  } catch (error) {
    console.error("Error sending email with Brevo:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred while sending the email.",
      error: error.message,
    });
  }
};

app.post("/api/send-mail", handleSendMail);
app.post("/send-mail", handleSendMail); // Alias route

app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "Brevo email service is running!" });
});

app.get("/", (req, res) => {
  res.send("API is running properly.");
});

// Catch-all 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route Not Found: ${req.method} ${req.originalUrl}`,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
