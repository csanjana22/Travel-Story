const multer = require('multer');
const path = require('path');

//Storage configuration 
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/'); //Destination folder
    },
    filename: function(req, file, cb) {
        // Create a unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

//File filter to allow only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

//Initialize multer instance with limits
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 5 // Maximum 5 files per upload
    }
});

// Create a middleware that handles both single and multiple file uploads
const handleImageUpload = (req, res, next) => {
    const uploadMiddleware = upload.array('images', 5);
    uploadMiddleware(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: true, message: err.message });
        }
        next();
    });
};

// Export the middleware
module.exports = {
    single: upload.single('image'),
    array: handleImageUpload
};