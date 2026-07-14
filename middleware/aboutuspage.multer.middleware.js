import multer from 'multer';
import { BAD_REQUEST } from '../error/error.js';

const imageFileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new BAD_REQUEST('Only image files are allowed'), false);
    }
};

const limits = { fileSize: 5 * 1024 * 1024 };

// 1. Multiple background images for Hero (max 5)
const uploadHeroImages = multer({
    dest: 'uploads/',
    limits,
    fileFilter: imageFileFilter
}).array('backgroundImages', 5);

// 2. Dual files upload for Platform
const uploadPlatformFiles = multer({
    dest: 'uploads/',
    limits,
    fileFilter: imageFileFilter
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'icon', maxCount: 1 }
]);

// 3. Dual files upload for Mission/Vision
const uploadMissionFiles = multer({
    dest: 'uploads/',
    limits,
    fileFilter: imageFileFilter
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'icon', maxCount: 1 }
]);

// 4. Partner logo
const uploadPartnerLogo = multer({
    dest: 'uploads/',
    limits,
    fileFilter: imageFileFilter
}).single('logo');

// 5. Article icon
const uploadArticleIcon = multer({
    dest: 'uploads/',
    limits,
    fileFilter: imageFileFilter
}).single('icon');

// 6. Strategic partnership image
const uploadStrategicFiles = multer({
    dest: 'uploads/',
    limits,
    fileFilter: imageFileFilter
}).single('image');

// 7. Team member image
const uploadMemberImage = multer({
    dest: 'uploads/',
    limits,
    fileFilter: imageFileFilter
}).single('image');

export {
    uploadHeroImages,
    uploadPlatformFiles,
    uploadMissionFiles,
    uploadPartnerLogo,
    uploadArticleIcon,
    uploadStrategicFiles,
    uploadMemberImage
};
