import multer from 'multer';
import { BAD_REQUEST } from '../error/error.js';

const imageFileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new BAD_REQUEST('Only image files are allowed'), false);
    }
};

// 1. Hero background images (multiple files, field name 'backgroundImages', max 5, max 5MB per file)
const uploadHeroImages = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter
}).array('backgroundImages', 5);

// 2. Event image (single file, field name 'image', max 10MB)
const uploadEventImage = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFileFilter
}).single('image');

// 3. Brand Card files (multiple fields: 'image' (1) and 'icon' (1), max 5MB per file)
const uploadBrandCardFiles = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'icon', maxCount: 1 }
]);

export {
    uploadHeroImages,
    uploadEventImage,
    uploadBrandCardFiles
};
