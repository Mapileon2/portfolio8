const express = require('express');
const ContactService = require('../services/ContactService');

const router = express.Router();
const contact = new ContactService();

// Submit contact form
router.post('/submit', async (req, res) => {
  try {
    const formData = {
      ...req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    const result = await contact.submitContactForm(formData);
    res.json(result);
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get contacts (admin endpoint)
router.get('/', (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const options = {
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

    const result = contact.getContacts(options);
    res.json(result);
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
});

// Get contact by ID (admin endpoint)
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const contactData = contact.getContactById(id);
    
    if (!contactData) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contactData);
  } catch (error) {
    console.error('Error getting contact:', error);
    res.status(500).json({ error: 'Failed to get contact' });
  }
});

// Update contact status (admin endpoint)
router.put('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updatedContact = contact.updateContactStatus(id, status);
    
    if (!updatedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ success: true, contact: updatedContact });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ error: 'Failed to update contact status' });
  }
});

// Get contact statistics (admin endpoint)
router.get('/stats/summary', (req, res) => {
  try {
    const { days = 30 } = req.query;
    const stats = contact.getContactStats(parseInt(days));
    res.json(stats);
  } catch (error) {
    console.error('Error getting contact stats:', error);
    res.status(500).json({ error: 'Failed to get contact stats' });
  }
});

module.exports = router;