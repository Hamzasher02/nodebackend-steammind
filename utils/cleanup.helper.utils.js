import fs from 'fs';

export default function cleanupUploadedFiles(req) {
  if (req.file && req.file.path && fs.existsSync(req.file.path)) {
    try { fs.unlinkSync(req.file.path); } catch {}
  }
  if (req.files) {
    if (Array.isArray(req.files)) {
      req.files.forEach(f => { if (f.path && fs.existsSync(f.path)) try { fs.unlinkSync(f.path); } catch {} });
    } else {
      Object.keys(req.files).forEach(k => {
        req.files[k].forEach(f => { if (f.path && fs.existsSync(f.path)) try { fs.unlinkSync(f.path); } catch {} });
      });
    }
  }
}

export async function handleCloudinaryUpload(req, file, oldPublicId = null) {
  return {
    secureUrl: "https://res.cloudinary.com/steamminds/image/upload/v12345678/mock.png",
    publicId: oldPublicId || "mock_public_id_" + Date.now()
  };
}

export async function handleMultipleCloudinaryUploads(req, files) {
  return files.map((f, i) => ({
    secureUrl: "https://res.cloudinary.com/steamminds/image/upload/v12345678/mock_" + i + ".png",
    publicId: "mock_public_id_" + Date.now() + "_" + i
  }));
}

export function safeJsonParse(req, input, errorMsg) {
  if (!input) return null;
  if (typeof input === 'object') return input;
  try {
    return JSON.parse(input);
  } catch (e) {
    return null;
  }
}
