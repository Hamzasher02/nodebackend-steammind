import multer from 'multer';
import { BAD_REQUEST } from '../error/error.js';

const imageFileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new BAD_REQUEST('Only image files are allowed'), false);
    }
};

// 1. Section 1 Background Image (single file, field name 'backgroundImage', max 5MB)
const uploadSection1Image = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter
}).single('backgroundImage');

// 2. Course Thumbnail (single file, field name 'thumbnail', max 5MB)
const uploadCourseThumbnail = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter
}).single('thumbnail');

export {
    uploadSection1Image,
    uploadCourseThumbnail
};
