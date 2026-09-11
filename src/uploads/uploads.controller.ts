import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { BadRequestException, Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UPLOADS_DIR } from './uploads.constants.js';

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

// Backs the outfit wizard's cropped-image upload (Day 4) and the brand logo
// upload that reuses the same cropper in single-crop mode. Files are saved
// to local disk and served back as static assets - see main.ts - matching
// the plan's "no cloud storage" decision (§4).
@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          callback(new BadRequestException('Only PNG, JPEG, and WebP images are allowed.'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request): { url: string } {
    if (!file) {
      throw new BadRequestException('No file was uploaded.');
    }
    return { url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}` };
  }
}
