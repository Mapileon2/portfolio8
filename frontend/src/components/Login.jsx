import React, { useState } from 'react';
import axios from 'axios';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:3000/login', form);
      localStorage.setItem('token', res.data.token);
      window.location = '/admin';
    } catch (e) {
      setError('Invalid credentials');
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Admin Login</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" variant="contained" fullWidth>Login</Button>
        </form>
      </Paper>
    </Box>
  );
}
