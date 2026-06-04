const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_FOLDER = 'travel-story-app';

function isCloudinaryUrl(url) {
    return typeof url === 'string' && url.includes('res.cloudinary.com');
}

function publicIdFromUrl(imageUrl) {
    if (!isCloudinaryUrl(imageUrl)) return null;
    const afterUpload = imageUrl.split('/upload/')[1];
    if (!afterUpload) return null;
    const pathOnly = afterUpload.split('?')[0];
    const segments = pathOnly.split('/').filter(Boolean);
    const withoutVersion = segments[0]?.match(/^v\d+$/) ? segments.slice(1) : segments;
    const publicIdWithExt = withoutVersion.join('/');
    return publicIdWithExt.replace(/\.[^/.]+$/, '') || null;
}

function uploadFile(file) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: UPLOAD_FOLDER, resource_type: 'image' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(file.buffer);
    });
}

async function uploadFiles(files) {
    const list = Array.isArray(files) ? files : [files];
    return Promise.all(list.map(uploadFile));
}

function uploadFromPath(filePath) {
    return cloudinary.uploader.upload(filePath, {
        folder: UPLOAD_FOLDER,
        resource_type: 'image',
    });
}

async function deleteByUrl(imageUrl) {
    const publicId = publicIdFromUrl(imageUrl);
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
}

async function deleteByUrls(imageUrls) {
    const cloudinaryUrls = imageUrls.filter(isCloudinaryUrl);
    await Promise.all(cloudinaryUrls.map(deleteByUrl));
}

module.exports = {
    uploadFiles,
    uploadFromPath,
    deleteByUrl,
    deleteByUrls,
    isCloudinaryUrl,
};
