"use server";

import nodemailer from "nodemailer";
import type { ActionState } from "@/app/admin/actions/action-state";

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  bookingDate?: string;
  message: string;
}

// Create transporter using environment variables
function createTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    throw new Error(
      "SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD environment variables."
    );
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
}

export async function sendContactEmailAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    // Extract form data
    const contactData: ContactFormData = {
      firstName: formData.get("firstName")?.toString() ?? "",
      lastName: formData.get("lastName")?.toString() ?? "",
      email: formData.get("email")?.toString() ?? "",
      bookingDate: formData.get("bookingDate")?.toString() || undefined,
      message: formData.get("message")?.toString() ?? "",
    };

    // Validate required fields
    if (
      !contactData.firstName ||
      !contactData.lastName ||
      !contactData.email ||
      !contactData.message
    ) {
      return {
        status: "error",
        message: "Please fill in all required fields.",
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
      return {
        status: "error",
        message: "Please provide a valid email address.",
      };
    }

    // Get recipient email from form data (passed from profile context)
    // Fallback to hardcoded email if not provided or invalid
    const profileRecipientEmail = formData.get("recipientEmail")?.toString();
    const recipientEmail =
      profileRecipientEmail && emailRegex.test(profileRecipientEmail)
        ? profileRecipientEmail
        : "gtengten1010@gmail.com";
    const senderName = `${contactData.firstName} ${contactData.lastName}`;
    const senderEmail = contactData.email;

    // Create email transporter
    const transporter = createTransporter();

    // Format booking date if provided
    const bookingDateText = contactData.bookingDate
      ? new Date(contactData.bookingDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Not specified";

    // Email content
    const subject = `New Contact Form Submission from ${contactData.firstName} ${contactData.lastName}`;
    const htmlContent = `
      <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Georgia', 'Times New Roman', serif;
                line-height: 1.8;
                color: #2B2520;
                max-width: 650px;
                margin: 0 auto;
                padding: 0;
                background-color: #F5F5F0;
              }
              .email-container {
                background-color: #FFFFFF;
                margin: 40px auto;
                box-shadow: 0 4px 20px rgba(43, 37, 32, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #2B2520 0%, #3D3935 100%);
                color: #F5EEEB;
                padding: 50px 40px;
                text-align: center;
                position: relative;
              }
              .header::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 60px;
                height: 3px;
                background: linear-gradient(90deg, #D4A574 0%, #C89666 100%);
              }
              .header h1 {
                margin: 0 0 10px 0;
                font-size: 32px;
                font-weight: 300;
                letter-spacing: 2px;
                text-transform: uppercase;
              }
              .header p {
                margin: 0;
                font-size: 16px;
                font-style: italic;
                color: #F5EEEB;
                opacity: 0.9;
              }
              .content {
                padding: 50px 40px;
                background-color: #FAFAF8;
              }
              .greeting {
                font-size: 18px;
                color: #2B2520;
                margin-bottom: 30px;
                font-style: italic;
                text-align: center;
                line-height: 1.6;
              }
              .divider {
                width: 80px;
                height: 2px;
                background: linear-gradient(90deg, transparent 0%, #D4A574 50%, transparent 100%);
                margin: 30px auto;
              }
              .field-group {
                margin-bottom: 35px;
                background-color: #FFFFFF;
                padding: 25px;
                border-radius: 4px;
                border-left: 4px solid #D4A574;
                box-shadow: 0 2px 8px rgba(43, 37, 32, 0.05);
                transition: transform 0.2s ease;
              }
              .field-label {
                font-size: 12px;
                font-weight: 600;
                color: #D4A574;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 10px;
                display: block;
              }
              .field-value {
                color: #2B2520;
                font-size: 16px;
                line-height: 1.6;
              }
              .field-value a {
                color: #D4A574;
                text-decoration: none;
                border-bottom: 1px solid #D4A574;
                transition: color 0.3s ease;
              }
              .field-value a:hover {
                color: #2B2520;
              }
              .message-box {
                background: linear-gradient(to right, #FAFAF8 0%, #FFFFFF 100%);
                padding: 25px;
                border-radius: 4px;
                border: 1px solid #E8E4DD;
                font-style: italic;
                white-space: pre-wrap;
                line-height: 1.8;
              }
              .footer {
                background-color: #2B2520;
                color: #F5EEEB;
                padding: 30px 40px;
                text-align: center;
                font-size: 14px;
              }
              .footer p {
                margin: 0 0 10px 0;
                opacity: 0.8;
              }
              .accent-line {
                width: 100%;
                height: 4px;
                background: linear-gradient(90deg, #D4A574 0%, #C89666 50%, #D4A574 100%);
              }
              .icon {
                display: inline-block;
                width: 20px;
                height: 20px;
                margin-right: 8px;
                vertical-align: middle;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="accent-line"></div>
              
              <div class="header">
                <h1>✨ New Booking Inquiry</h1>
                <p>A new client wants to capture their special moments</p>
              </div>
              
              <div class="content">
                <div class="greeting">
                  You have received a new inquiry from a potential client who would like to book your photography services.
                </div>
                
                <div class="divider"></div>
                
                <div class="field-group">
                  <span class="field-label">👤 Client Name</span>
                  <div class="field-value">
                    ${contactData.firstName} ${contactData.lastName}
                  </div>
                </div>
                
                <div class="field-group">
                  <span class="field-label">📧 Email Address</span>
                  <div class="field-value">
                    <a href="mailto:${contactData.email}">${
      contactData.email
    }</a>
                  </div>
                </div>
                
                <div class="field-group">
                  <span class="field-label">📅 Preferred Booking Date</span>
                  <div class="field-value">
                    ${bookingDateText}
                  </div>
                </div>
                
                <div class="field-group">
                  <span class="field-label">💬 Message from Client</span>
                  <div class="message-box">
                    ${contactData.message.replace(/\n/g, "<br>")}
                  </div>
                </div>
                
                <div class="divider"></div>
                
                <div style="text-align: center; margin-top: 40px;">
                  <p style="color: #D4A574; font-style: italic; font-size: 14px;">
                    "Every moment matters, every memory counts"
                  </p>
                </div>
              </div>
              
              <div class="footer">
                <p><strong>Jitendra Photography</strong></p>
                <p>Capturing moments of love & happiness</p>
                <p style="font-size: 12px; margin-top: 20px;">
                  This is an automated notification from your website contact form
                </p>
              </div>
              
              <div class="accent-line"></div>
            </div>
          </body>
        </html>
    `;

    const textContent = `
New Contact Form Submission

Name: ${contactData.firstName} ${contactData.lastName}
Email: ${contactData.email}
Preferred Booking Date: ${bookingDateText}

Message:
${contactData.message}
    `.trim();

    // Send email
    // Try to use the user's email as the "from" address.
    // Some SMTP servers (like Gmail) may require the "from" to match the authenticated account.
    // If that fails, we'll fall back to using SMTP_USER as the from address.
    try {
      await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: recipientEmail,
        replyTo: senderEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
    } catch (fromError) {
      // If the "from" address is rejected, fall back to using the authenticated SMTP user
      // but still set reply-to to the user's email so replies work correctly
      const smtpUser = process.env.SMTP_USER;
      if (
        fromError instanceof Error &&
        (fromError.message.includes("from") ||
          fromError.message.includes("sender") ||
          fromError.message.includes("authentication"))
      ) {
        await transporter.sendMail({
          from: `"${senderName}" <${smtpUser}>`,
          to: recipientEmail,
          replyTo: senderEmail,
          subject,
          text: textContent,
          html: htmlContent,
        });
      } else {
        // Re-throw if it's a different error
        throw fromError;
      }
    }

    return {
      status: "success",
      message: "Thank you! Your message has been sent successfully.",
    };
  } catch (error) {
    console.error("Error sending contact email:", error);

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes("SMTP configuration")) {
        return {
          status: "error",
          message:
            "Email service is not configured. Please contact the administrator.",
        };
      }
      if (
        error.message.includes("Invalid login") ||
        error.message.includes("authentication")
      ) {
        return {
          status: "error",
          message:
            "Email authentication failed. Please contact the administrator.",
        };
      }
      if (
        error.message.includes("timeout") ||
        error.message.includes("ECONNREFUSED")
      ) {
        return {
          status: "error",
          message: "Unable to connect to email server. Please try again later.",
        };
      }
    }

    return {
      status: "error",
      message:
        "Sorry, there was an error sending your message. Please try again later.",
    };
  }
}
