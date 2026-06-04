/**
 * One-time migration: upload backend/uploads/* to Cloudinary and update MongoDB imageUrls.
 *
 * Prerequisites: CLOUDINARY_* in backend/.env, MongoDB reachable.
 * Run from backend/: npm run migrate-uploads
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config');
const TravelStory = require('../models/travelStory.model');
const { uploadFromPath, isCloudinaryUrl } = require('../cloudinary');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

async function main() {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('Missing CLOUDINARY_* variables in backend/.env');
        process.exit(1);
    }

    if (!fs.existsSync(UPLOADS_DIR)) {
        console.error('uploads folder not found:', UPLOADS_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(UPLOADS_DIR).filter((name) => {
        const full = path.join(UPLOADS_DIR, name);
        return fs.statSync(full).isFile();
    });

    if (files.length === 0) {
        console.log('No files in uploads/. Nothing to migrate.');
        process.exit(0);
    }

    console.log(`Found ${files.length} file(s) in uploads/`);

    if (!config.connectionString) {
        console.error('MONGO_URI is required in backend/.env');
        process.exit(1);
    }
    await mongoose.connect(config.connectionString);

    const filenameToCloudinaryUrl = new Map();

    for (const file of files) {
        const filePath = path.join(UPLOADS_DIR, file);
        try {
            process.stdout.write(`Uploading ${file}... `);
            const result = await uploadFromPath(filePath);
            filenameToCloudinaryUrl.set(file, result.secure_url);
            console.log('ok');
        } catch (err) {
            console.log('failed');
            console.error(`  ${file}: ${err.message}`);
        }
    }

    const stories = await TravelStory.find({});
    let updatedStories = 0;
    let replacedUrls = 0;

    for (const story of stories) {
        let changed = false;
        const newUrls = story.imageUrls.map((url) => {
            if (!url || typeof url !== 'string' || isCloudinaryUrl(url)) {
                return url;
            }
            const filename = path.basename(url.split('?')[0]);
            const cloudinaryUrl = filenameToCloudinaryUrl.get(filename);
            if (cloudinaryUrl) {
                changed = true;
                replacedUrls++;
                return cloudinaryUrl;
            }
            return url;
        });

        if (changed) {
            story.imageUrls = newUrls;
            await story.save();
            updatedStories++;
        }
    }

    console.log('\nDone.');
    console.log(`  Uploaded to Cloudinary: ${filenameToCloudinaryUrl.size}`);
    console.log(`  Stories updated: ${updatedStories}`);
    console.log(`  Image URLs replaced: ${replacedUrls}`);

    const unmatched = [];
    for (const story of stories) {
        for (const url of story.imageUrls) {
            if (url && typeof url === 'string' && !isCloudinaryUrl(url) && url.includes('/uploads/')) {
                unmatched.push({ storyId: story._id, url });
            }
        }
    }
    if (unmatched.length > 0) {
        console.log(`  Still pointing at local /uploads/: ${unmatched.length} (filename not in uploads/ folder)`);
    }

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
