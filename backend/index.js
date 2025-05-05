const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;
const JWT_SECRET = 'your_jwt_secret';

app.use(cors());
app.use(express.json());

// Initialize Sequelize with SQLite
env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
});

// Models
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'user' },
});

const Project = sequelize.define('Project', {
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  link: DataTypes.STRING,
});

const Skill = sequelize.define('Skill', {
  name: DataTypes.STRING,
  level: DataTypes.STRING,
});

const Testimonial = sequelize.define('Testimonial', {
  author: DataTypes.STRING,
  content: DataTypes.TEXT,
});

const Contact = sequelize.define('Contact', {
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  address: DataTypes.STRING,
});

const CaseStudy = sequelize.define('CaseStudy', {
  title: DataTypes.STRING,
  subtitle: DataTypes.STRING,
  content: DataTypes.TEXT,
  image: DataTypes.STRING,
});

// Auth endpoints
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ username, password: hash });
    res.json({ id: user.id, username: user.username });
  } catch (e) {
    res.status(400).json({ error: 'Username taken' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
  res.json({ token });
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// CRUD endpoints for each section
app.get('/projects', async (req, res) => {
  res.json(await Project.findAll());
});
app.post('/projects', authMiddleware, async (req, res) => {
  res.json(await Project.create(req.body));
});
app.put('/projects/:id', authMiddleware, async (req, res) => {
  await Project.update(req.body, { where: { id: req.params.id } });
  res.json({ success: true });
});
app.delete('/projects/:id', authMiddleware, async (req, res) => {
  await Project.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
});

app.get('/skills', async (req, res) => {
  res.json(await Skill.findAll());
});
app.post('/skills', authMiddleware, async (req, res) => {
  res.json(await Skill.create(req.body));
});
app.put('/skills/:id', authMiddleware, async (req, res) => {
  await Skill.update(req.body, { where: { id: req.params.id } });
  res.json({ success: true });
});
app.delete('/skills/:id', authMiddleware, async (req, res) => {
  await Skill.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
});

app.get('/testimonials', async (req, res) => {
  res.json(await Testimonial.findAll());
});
app.post('/testimonials', authMiddleware, async (req, res) => {
  res.json(await Testimonial.create(req.body));
});
app.put('/testimonials/:id', authMiddleware, async (req, res) => {
  await Testimonial.update(req.body, { where: { id: req.params.id } });
  res.json({ success: true });
});
app.delete('/testimonials/:id', authMiddleware, async (req, res) => {
  await Testimonial.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
});

app.get('/contact', async (req, res) => {
  res.json(await Contact.findOne());
});
app.post('/contact', authMiddleware, async (req, res) => {
  await Contact.destroy({ where: {} }); // Only one contact row
  res.json(await Contact.create(req.body));
});

app.get('/case-studies', async (req, res) => {
  res.json(await CaseStudy.findAll());
});
app.post('/case-studies', authMiddleware, async (req, res) => {
  res.json(await CaseStudy.create(req.body));
});
app.put('/case-studies/:id', authMiddleware, async (req, res) => {
  await CaseStudy.update(req.body, { where: { id: req.params.id } });
  res.json({ success: true });
});
app.delete('/case-studies/:id', authMiddleware, async (req, res) => {
  await CaseStudy.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Sync DB and start server
sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
});
