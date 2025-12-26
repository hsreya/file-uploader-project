const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const methodOverride = require('method-override');


const app = express();

//middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

//mongo uri
const mongoURI = 'mongodb+srv://shreyapurandare24_db_user:pugXDFUpEaNsD19y@cluster0.2quqhwj.mongodb.net/?appName=Cluster0';

//create mongo connection
const conn = mongoose.createConnection(mongoURI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    tls: true,
    tlsAllowInvalidCertificates: false, // Set to true only for testing, not recommended for production
});

// Handle connection errors
conn.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    // Don't crash the app, just log the error
});

conn.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

conn.on('reconnected', () => {
    console.log('MongoDB reconnected');
});

//init gfs
let gfs;
conn.once('open', () => {
    //init stream
    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
    });
});

//storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });

//@route GET /
//@desc Loads form

app.get('/', (req, res) => {
    res.render('index');

});

//@route POST /upload
//@desc Uploads file to DB
app.post('/upload', upload.single('file'), (req, res) => {
    //res.json({ file: req.file });
    res.redirect('/');
});


//@route GET /files
//@desc Display all files in JSON
app.get('/files', (req, res) => {
    if (!gfs) {
        return res.status(500).json({ err: 'Database not connected' });
    }
    gfs.files.find({}).toArray((err, files) => {
        //check if files
        if (!files || files.length === 0) {
            return res.status(404).json({
                err: 'No files exist'
            });
        }
        //files exist
        return res.json(files);
    });
});

//@route GET /files/:filename
//@desc Display all files in JSON
app.get('/files/:filename', (req, res) => {
    if (!gfs) {
        return res.status(500).json({ err: 'Database not connected' });
    }
    gfs.files.find({ filename: req.params.filename }).toArray((err, files) => {
        //check if files
        if (!files || files.length === 0) {
            return res.status(404).json({ 
                err: 'No file exists'
            });
        }
        //file exists
        return res.json(files);
    });
});
const port = 5000;
app.listen(port, () => console.log(`Server started on port ${port}`)); 
