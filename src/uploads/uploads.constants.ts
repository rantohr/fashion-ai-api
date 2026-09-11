import { join } from 'node:path';

// Local disk storage per the plan (§4): no cloud storage for this project.
export const UPLOADS_DIR = join(process.cwd(), 'uploads');
export const UPLOADS_URL_PREFIX = '/uploads/';
