// Contact form endpoint for Vercel
const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST) {
    console.log('SMTP not configured, using mock email service');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    });
    return;
  }

  try {
    const { name, email, subject, message, phone, company } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, email, and message are required'
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format'
        }
      });
    }

    const contactData = {
      id: Date.now().toString(),
      name,
      email,
      subject: subject || 'Contact Form Submission',
      message,
      phone: phone || '',
      company: company || '',
      timestamp: new Date().toISOString(),
      status: 'new'
    };

    // Try to send email
    const transporter = createTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
          subject: `Portfolio Contact: ${contactData.subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${contactData.name}</p>
            <p><strong>Email:</strong> ${contactData.email}</p>
            <p><strong>Phone:</strong> ${contactData.phone}</p>
            <p><strong>Company:</strong> ${contactData.company}</p>
            <p><strong>Subject:</strong> ${contactData.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${contactData.message.replace(/\n/g, '<br>')}</p>
            <p><strong>Submitted:</strong> ${new Date(contactData.timestamp).toLocaleString()}</p>
          `
        });
        console.log('Contact email sent successfully');
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Continue without failing the request
      }
    }

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        id: contactData.id,
        timestamp: contactData.timestamp
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process contact form'
      }
    });
  }
};