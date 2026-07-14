import fs from "fs";

function cleanupUploadedFiles(req) {
    // this condition will handle single file 
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("error deleting file:", err);
        })
    }

    // this condition will handle multiple files 
    if (req.files) {
        req.files.forEach((f) => {
            fs.unlink(f.path, (err) => {
                if (err) console.error("error deleting file:", err);
            })
        })
    }
}


export default cleanupUploadedFiles