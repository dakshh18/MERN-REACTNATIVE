import multer from 'multer';
import path from "path";


const storage = multer.diskStorage({
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        const safeExt = ['.jpeg', '.jpg', '.png', '.webp'].includes(ext) ? ext : '';
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null , `${unique}${safeExt}`);
    }
})

// filter the file types : jpeg , jpg , png , webp
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if(extname && mimetype){
        cb(null , true);
    }else{
        cb(new Error("Unsupported file type"), false);
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
    }
})

export default upload;