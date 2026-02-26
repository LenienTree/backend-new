import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import s3Client from '../config/s3';
import { config } from '../config/config';
import { AppError } from './apiResponse';

type UploadFolder = 'banners' | 'avatars' | 'gallery' | 'certificates' | 'posters';

export interface UploadResult {
    secure_url: string;
    key: string;
}

export const uploadToS3 = async (
    fileBuffer: Buffer,
    folder: UploadFolder,
    fileName?: string,
    contentType: string = 'image/jpeg'
): Promise<UploadResult> => {
    try {
        const key = fileName
            ? `lenienttree/${folder}/${fileName}`
            : `lenienttree/${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: config.s3.bucketName,
                Key: key,
                Body: fileBuffer,
                ContentType: contentType,
            },
        });

        await upload.done();

        // Construct the URL. Note: This assumes a standard S3 bucket URL structure.
        // For production, you might want to use a CDN (CloudFront) URL.
        const url = `https://${config.s3.bucketName}.s3.${config.s3.region}.amazonaws.com/${key}`;

        return {
            secure_url: url,
            key: key,
        };
    } catch (error) {
        console.error('S3 Upload Error:', error);
        throw new AppError('File upload failed', 500);
    }
};

export const deleteFromS3 = async (key: string): Promise<void> => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: config.s3.bucketName,
            Key: key,
        });
        await s3Client.send(command);
    } catch (error) {
        console.error('S3 Delete Error:', error);
        // We don't necessarily want to throw an error if delete fails during a wider operation,
        // but for now we follow the previous pattern.
    }
};
