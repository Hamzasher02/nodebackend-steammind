import multer from 'multer';
import { BAD_REQUEST } from '../error/error.js';

const singleProfilePicture = multer({
  dest: 'uploads/',
  limits: { fileSize: 1 * 1024 * 1024 }
}).single('profilePicture')

// Hamza Sher: Fixed field name for transcript, accepts any file type
const singleTranscript = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('transcript') // Fixed field name: transcript

const uploadTranscriptAndProfilePictrue = multer({ dest: 'uploads/' }).array('files', 2)


//hamza hanif
const uploadLectureVideo = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 750 * 1024 * 1024 //750mb allowed 
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/mkv", "video/webm"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new BAD_REQUEST("Only video files are allowed"));
  }
}).single('lecture');



//hamza hanif
const singlePdfFile = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new BAD_REQUEST("Only PDF files are allowed"));
  }
}).single('pdf');

// Payment screenshot uploader (images only, max 5MB)
const singlePaymentScreenshot = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new BAD_REQUEST('Only image files are allowed'));
  }
}).single('paymentScreenshot');

const uploadTwoFiles = multer({ dest: 'uploads/' }).array('files', 2)

// Discussion attachments - supports images and general files (max 5 attachments, 10MB each)
const discussionAttachments = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).array('attachments', 5);


export { uploadLectureVideo, uploadTwoFiles, singleProfilePicture, singlePdfFile, singleTranscript, uploadTranscriptAndProfilePictrue, singlePaymentScreenshot, discussionAttachments }
