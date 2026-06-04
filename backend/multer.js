const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5,
    },
});

const handleImageUpload = (req, res, next) => {
    const uploadMiddleware = upload.array('images', 5);
    uploadMiddleware(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: true, message: err.message });
        }
        next();
    });
};

module.exports = {
    single: upload.single('image'),
    array: handleImageUpload,
};
