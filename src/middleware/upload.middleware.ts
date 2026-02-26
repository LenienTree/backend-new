import multer from 'multer';
import { AppError } from '../utils/apiResponse';
import { Request } from 'express';

// Use memory storage — buffers are passed to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('Only image files are allowed (jpeg, png, webp, gif).', 400));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5mb
    },
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadFields = (fields: { name: string; maxCount: number }[]) =>
    upload.fields(fields);
