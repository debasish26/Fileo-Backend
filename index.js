const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Import CORS package
require('dotenv').config();

const app = express();
const PORT = 3000;

// MongoDB Connection
mongoose.connect(
  process.env.CONNECTION_STRING,
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Middleware
const upload = multer({ dest: 'uploads/' });
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS
app.use(cors()); // This will allow all domains to make requests

const SECRET_KEY = process.env.SECRET_KEY;

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Routes
app.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    try {
      const newUser = new User({ email, password, name });
      await newUser.save();
      res.status(200).json({ message: 'User registered successfully' });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  });

app.post('/', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password });
    if (user) {
      const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: '1h' });
      res.status(200).json({ message: 'Logged in successfully', token });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error authenticating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const email = req.body.email;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const mailOptions = {
    from: 'devasish024h@gmail.com',
    to: email,
    subject: 'Your File is Ready to Download from Fileo 📄',
    text: "File mil gya na !! ab BKL ek Coffee pilana",
    attachments: [
      {
        filename: file.originalname,
        content: fs.createReadStream(file.path),
        encoding: 'base64',
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Error sending email' });
    }
    console.log('Email sent:', info);
    res.status(200).json({ message: 'File uploaded and email sent successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
