const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const serviceAccount = require('./project-one-e9203-firebase-adminsdk-6e62k-139fd00fb2.json');
const { getFirestore } = require('firebase-admin/firestore');
const express = require('express')
const multer = require('multer')
const app = express()
const PORT = 3000;
const path = require('path')
const nodemailer = require('nodemailer')
const fs = require('fs')
require('dotenv').config();

const upload = multer({ dest: 'uploads/' });
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const db = getFirestore()
const SECRET_KEY = process.env.SECRET_KEY;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
})

app.post('/register', async(req , res)=>{
    const {email , password , name} = req.body
    try {
        const docRef = db.collection('users').doc(email)

        await docRef.set({
            email: email ,
            password: password,
            name: name,
        })



    } catch (error) {
        console.log(error)
    }
    res.status(200).json({ message: 'User registered successfully' });

})

app.post('/', async (req, res) => {
    const { email, password } = req.body;
    let tokem = ''
    let pass = ''

    try {
        const snapshot = await db.collection('users').get();
        let isAuthenticated = false;

        snapshot.forEach((doc) => {
            if (email === doc.data().email && password === doc.data().password) {
                isAuthenticated = true;
                tokem = doc.data().email
            }
        });

        if (isAuthenticated) {
            console.log(tokem)
            console.log(pass)
            const token = jwt.sign({ email: tokem }, SECRET_KEY, { expiresIn: '1h' });

            return res.status(200).json({ message: 'Logged in successfully' ,token});
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error authenticating user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/upload',upload.single('file'),async (req , res)=>{
    const file = req.file;
    const email = req.body.email;


    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    console.log("email: ", email);

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    console.log(file.size)

    if(!file){
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const mailOptions = {
        from: 'devasish024h@gmail.com',
        to: email,
        subject: 'Your File is Ready to Download from Fileo 📄',
        text: "File mil gya na !! ab BKL ek Coffie pilana",
        attachments: [
            {
                filename: file.originalname,
                content: fs.createReadStream(file.path),
                encoding: 'base64',
            }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);  // Log error for debugging
            return res.status(500).json({ message: 'Error sending email' });
        }
        console.log('Email sent:', info);
        res.status(200).json({ message: 'File uploaded and email sent successfully'});
    });


})



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
