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

// 1. Hero background image (single file)
const uploadProductsHeroImage = multer({
    dest: 'uploads/',
    limits,
    fileFilter: imageFileFilter
}).single('backgroundImage');

// 2. Section image (single file)
const uploadProductSectionImage = multer({
    dest: 'uploads/',
    limits,
    fileFilter: imageFileFilter
}).single('image');

export {
    uploadProductsHeroImage,
    uploadProductSectionImage
};
