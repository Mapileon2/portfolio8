const nodemailer = require('nodemailer');
const NodeCache = require('node-cache');
const fs = require('fs').promises;
const path = require('path');

class ContactService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
    this.dataFile = path.join(__dirname, '../data/contacts.json');
    this.contacts = [];
    this.transporter = null;
    
    this.setupEmailTransporter();
    this.loadContacts();
  }

  setupEmailTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      console.log('📧 Email transporter configured');
    } else {
      console.log('📧 Email not configured - contact forms will be saved locally');
    }
  }

  async loadContacts() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf8');
      const parsed = JSON.parse(data);
      this.contacts = parsed.contacts || [];
    } catch (error) {
      console.log('No existing contact data found, starting fresh');
      await this.ensureDataDirectory();
    }
  }

  async ensureDataDirectory() {
    const dataDir = path.dirname(this.dataFile);
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
    }
  }

  async saveContacts() {
    try {
      await this.ensureDataDirectory();
      const data = {
        contacts: this.contacts,
        lastSaved: new Date().toISOString()
      };
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving contact data:', error);
    }
  }

  async submitContactForm(formData) {
    const { name, email, subject, message, phone, company } = formData;

    // Validate required fields
    if (!name || !email || !message) {
      throw new Error('Name, email, and message are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Rate limiting check
    const rateLimitKey = `contact_${email}`;
    const lastSubmission = this.cache.get(rateLimitKey);
    if (lastSubmission) {
      throw new Error('Please wait before submitting another message');
    }

    // Create contact record
    const contact = {
      id: this.generateId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject?.trim() || 'Contact Form Submission',
      message: message.trim(),
      phone: phone?.trim(),
      company: company?.trim(),
      timestamp: new Date().toISOString(),
      status: 'new',
      ip: formData.ip,
      userAgent: formData.userAgent
    };

    // Save contact
    this.contacts.push(contact);
    await this.saveContacts();

    // Set rate limit (5 minutes)
    this.cache.set(rateLimitKey, Date.now(), 300);

    // Send email notification if configured
    if (this.transporter) {
      try {
        await this.sendEmailNotification(contact);
        contact.emailSent = true;
      } catch (error) {
        console.error('Error sending email notification:', error);
        contact.emailError = error.message;
      }
    }

    // Send auto-reply if configured
    if (this.transporter && process.env.SEND_AUTO_REPLY === 'true') {
      try {
        await this.sendAutoReply(contact);
        contact.autoReplySent = true;
      } catch (error) {
        console.error('Error sending auto-reply:', error);
      }
    }

    console.log(`📧 Contact form submitted by ${name} (${email})`);
    
    return {
      id: contact.id,
      message: 'Thank you for your message! I\'ll get back to you soon.',
      timestamp: contact.timestamp
    };
  }

  async sendEmailNotification(contact) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      subject: `Portfolio Contact: ${contact.subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${contact.name}</p>
        <p><strong>Email:</strong> ${contact.email}</p>
        ${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ''}
        ${contact.company ? `<p><strong>Company:</strong> ${contact.company}</p>` : ''}
        <p><strong>Subject:</strong> ${contact.subject}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${contact.message.replace(/\n/g, '<br>')}
        </div>
        <hr>
        <p><small>Submitted: ${new Date(contact.timestamp).toLocaleString()}</small></p>
        <p><small>IP: ${contact.ip || 'Unknown'}</small></p>
      `,
      text: `
        New Contact Form Submission
        
        Name: ${contact.name}
        Email: ${contact.email}
        ${contact.phone ? `Phone: ${contact.phone}` : ''}
        ${contact.company ? `Company: ${contact.company}` : ''}
        Subject: ${contact.subject}
        
        Message:
        ${contact.message}
        
        Submitted: ${new Date(contact.timestamp).toLocaleString()}
        IP: ${contact.ip || 'Unknown'}
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendAutoReply(contact) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: contact.email,
      subject: 'Thank you for contacting me!',
      html: `
        <h2>Thank you for your message, ${contact.name}!</h2>
        <p>I've received your message and will get back to you as soon as possible.</p>
        
        <h3>Your Message:</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <strong>Subject:</strong> ${contact.subject}<br><br>
          ${contact.message.replace(/\n/g, '<br>')}
        </div>
        
        <p>Best regards,<br>
        ${process.env.SITE_NAME || 'Portfolio Owner'}</p>
        
        <hr>
        <p><small>This is an automated response. Please do not reply to this email.</small></p>
      `,
      text: `
        Thank you for your message, ${contact.name}!
        
        I've received your message and will get back to you as soon as possible.
        
        Your Message:
        Subject: ${contact.subject}
        ${contact.message}
        
        Best regards,
        ${process.env.SITE_NAME || 'Portfolio Owner'}
        
        ---
        This is an automated response. Please do not reply to this email.
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  getContacts(options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    let filteredContacts = [...this.contacts];
    
    if (status) {
      filteredContacts = filteredContacts.filter(contact => contact.status === status);
    }

    // Sort by timestamp (newest first)
    filteredContacts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = filteredContacts.length;
    const paginatedContacts = filteredContacts.slice(offset, offset + limit);

    return {
      contacts: paginatedContacts,
      total,
      limit,
      offset
    };
  }

  getContactById(id) {
    return this.contacts.find(contact => contact.id === id);
  }

  updateContactStatus(id, status) {
    const contact = this.contacts.find(c => c.id === id);
    if (contact) {
      contact.status = status;
      contact.updatedAt = new Date().toISOString();
      this.saveContacts();
      return contact;
    }
    return null;
  }

  getContactStats(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentContacts = this.contacts.filter(contact => 
      new Date(contact.timestamp) > cutoffDate
    );

    const statusCounts = {};
    const dailyStats = {};

    recentContacts.forEach(contact => {
      // Status counts
      statusCounts[contact.status] = (statusCounts[contact.status] || 0) + 1;
      
      // Daily stats
      const date = new Date(contact.timestamp).toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });

    return {
      totalContacts: recentContacts.length,
      statusBreakdown: statusCounts,
      dailyStats: Object.entries(dailyStats)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([date, count]) => ({ date, count })),
      responseRate: this.calculateResponseRate(recentContacts)
    };
  }

  calculateResponseRate(contacts) {
    const responded = contacts.filter(c => c.status === 'responded').length;
    return contacts.length > 0 ? (responded / contacts.length) * 100 : 0;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Cleanup old contacts (keep for 1 year)
  cleanup() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const originalLength = this.contacts.length;
    this.contacts = this.contacts.filter(contact => 
      new Date(contact.timestamp) > oneYearAgo
    );
    
    if (this.contacts.length < originalLength) {
      this.saveContacts();
      console.log(`📧 Cleaned up ${originalLength - this.contacts.length} old contacts`);
    }
  }
}

module.exports = ContactService;