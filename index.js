const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); 
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
});

const User = mongoose.model('User', userSchema);

// Middleware
const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS
app.use(cors());

const SECRET_KEY = process.env.SECRET_KEY;

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});


app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    const email = req.body.email;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Check if email already exists in the database
        const existingUser = await User.findOne({ email });

        if (existingUser) {
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

        } else {
            const newUser = new User({ email });
            await newUser.save();

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

        }

    } catch (error) {
        console.error('Error: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
