import multer from 'multer';

const limits = { fileSize: 10 * 1024 * 1024 }; // 10MB limit

const uploadChatDocument = multer({
    dest: 'uploads/',
    limits
}).single('document');

export {
    uploadChatDocument
};
