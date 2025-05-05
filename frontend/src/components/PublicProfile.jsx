import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, Link } from '@mui/material';

const api = axios.create({ baseURL: 'http://localhost:3000' });

export default function PublicProfile() {
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [contact, setContact] = useState({});

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data));
    api.get('/skills').then(res => setSkills(res.data));
    api.get('/testimonials').then(res => setTestimonials(res.data));
    api.get('/contact').then(res => setContact(res.data || {}));
  }, []);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>My Public Profile</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5">Contact</Typography>
        <div><b>Email:</b> {contact.email}</div>
        <div><b>Phone:</b> {contact.phone}</div>
        <div><b>Address:</b> {contact.address}</div>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5">Projects</Typography>
        {projects.map(p => (
          <Box key={p.id} sx={{ mb: 1 }}>
            <b>{p.title}</b>: {p.description} {p.link && (<Link href={p.link} target="_blank">[Link]</Link>)}
          </Box>
        ))}
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5">Skills</Typography>
        {skills.map(s => (
          <span key={s.id}>{s.name} ({s.level})&nbsp; </span>
        ))}
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5">Testimonials</Typography>
        {testimonials.map(t => (
          <Box key={t.id} sx={{ mb: 1 }}>
            <i>"{t.content}"</i> - <b>{t.author}</b>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
