import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, TextField, Typography, Paper, Box, Tabs, Tab } from '@mui/material';

const api = axios.create({ baseURL: 'http://localhost:3000' });

function SectionEditor({ title, endpoint, fields }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    api.get(`/${endpoint}`).then(res => setItems(res.data));
  }, [endpoint]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (editingId) {
      await api.put(`/${endpoint}/${editingId}`, form, authHeader());
    } else {
      await api.post(`/${endpoint}`, form, authHeader());
    }
    setForm({}); setEditingId(null);
    api.get(`/${endpoint}`).then(res => setItems(res.data));
  };

  const handleEdit = item => {
    setForm(item);
    setEditingId(item.id);
  };

  const handleDelete = async id => {
    await api.delete(`/${endpoint}/${id}`, authHeader());
    api.get(`/${endpoint}`).then(res => setItems(res.data));
  };

  function authHeader() {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">{title}</Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        {fields.map(f => (
          <TextField
            key={f.name}
            name={f.name}
            label={f.label}
            value={form[f.name] || ''}
            onChange={handleChange}
            size="small"
          />
        ))}
        <Button onClick={handleSave} variant="contained">{editingId ? 'Update' : 'Add'}</Button>
      </Box>
      {items.map(item => (
        <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
          {fields.map(f => <span key={f.name}><b>{f.label}:</b> {item[f.name]}</span>)}
          <Button size="small" onClick={() => handleEdit(item)}>Edit</Button>
          <Button size="small" color="error" onClick={() => handleDelete(item.id)}>Delete</Button>
        </Box>
      ))}
    </Paper>
  );
}

function ContactEditor() {
  const [contact, setContact] = useState({});
  const [form, setForm] = useState({});

  useEffect(() => {
    api.get('/contact').then(res => setContact(res.data || {}));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    await api.post('/contact', form, authHeader());
    api.get('/contact').then(res => setContact(res.data));
    setForm({});
  };

  function authHeader() {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">Contact Info</Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        {['email', 'phone', 'address'].map(f => (
          <TextField
            key={f}
            name={f}
            label={f.charAt(0).toUpperCase() + f.slice(1)}
            value={form[f] || ''}
            onChange={handleChange}
            size="small"
          />
        ))}
        <Button onClick={handleSave} variant="contained">Save</Button>
      </Box>
      {contact && (
        <Box>
          <b>Email:</b> {contact.email || ''} <b>Phone:</b> {contact.phone || ''} <b>Address:</b> {contact.address || ''}
        </Box>
      )}
    </Paper>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState(0);
  useEffect(() => {
    if (!localStorage.getItem('token')) window.location = '/login';
  }, []);
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Admin Panel</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Projects" />
        <Tab label="Skills" />
        <Tab label="Testimonials" />
        <Tab label="Contact" />
      </Tabs>
      {tab === 0 && (
        <SectionEditor title="Projects" endpoint="projects" fields={[
          { name: 'title', label: 'Title' },
          { name: 'description', label: 'Description' },
          { name: 'link', label: 'Link' },
        ]} />
      )}
      {tab === 1 && (
        <SectionEditor title="Skills" endpoint="skills" fields={[
          { name: 'name', label: 'Skill Name' },
          { name: 'level', label: 'Level' },
        ]} />
      )}
      {tab === 2 && (
        <SectionEditor title="Testimonials" endpoint="testimonials" fields={[
          { name: 'author', label: 'Author' },
          { name: 'content', label: 'Content' },
        ]} />
      )}
      {tab === 3 && <ContactEditor />}
    </Box>
  );
}
