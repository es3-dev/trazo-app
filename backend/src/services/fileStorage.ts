import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import path from 'path';

const storageMode = process.env.FILE_STORAGE || 'local';
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'trazo-files';

const supabase =
  storageMode === 'supabase'
    ? createClient(
        requiredEnv('SUPABASE_URL'),
        requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      )
    : null;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set when FILE_STORAGE=supabase`);
  }
  return value;
}

export async function saveUploadedFile(
  file: Express.Multer.File,
  prefix = '',
): Promise<string> {
  if (storageMode !== 'supabase') {
    if (!file.filename) {
      throw new Error('Local upload storage did not provide a filename');
    }
    return file.filename;
  }

  const filename = `${prefix}${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
  if (!supabase) {
    throw new Error('Supabase Storage is not configured');
  }

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  return filename;
}

export function getPublicUploadUrl(filename: string): string {
  if (storageMode !== 'supabase' || !supabase) {
    throw new Error('Public storage URLs are only available with Supabase Storage');
  }
  return supabase.storage.from(bucketName).getPublicUrl(filename).data.publicUrl;
}
