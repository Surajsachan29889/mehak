// import cloudinary from 'cloudinary'
// import {CloudinaryStorage} from 'multer-storage-cloudinary'
import dotenv from "dotenv";
dotenv.config();


import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'avatars',
            public_id: `${req.userid}-${Date.now()}`,
        };
    },
});
console.log("cloudinary");
export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: (req, file, cb) => {
        console.log('File filter middleware called');
        console.log('File mimetype:', file.mimetype);
        if (!file.mimetype.startsWith('image/')) {
            console.log('File rejected');
            return cb(new Error('Only image files are allowed!'), false);
        }
        console.log('File accepted', req.url);
        cb(null, true);
    },
});

