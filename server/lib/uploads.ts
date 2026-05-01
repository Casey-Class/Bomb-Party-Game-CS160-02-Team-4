import { mkdir, rm, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const AVATAR_UPLOAD_DIR = join(import.meta.dir, "..", "uploads", "avatars");
const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function getFilenameFromUrl(avatarUrl: string | null) {
  if (!avatarUrl) {
    return null;
  }

  const withoutQuery = avatarUrl.split("?")[0] ?? avatarUrl;
  const filename = withoutQuery.split("/").pop();
  return filename?.trim() ? filename : null;
}

export function isSupportedAvatarMimeType(contentType: string) {
  return contentType in MIME_TYPE_TO_EXTENSION;
}

export function getAvatarUploadLimitBytes() {
  return MAX_AVATAR_FILE_SIZE_BYTES;
}

export async function ensureUploadDirectories() {
  await mkdir(AVATAR_UPLOAD_DIR, { recursive: true });
}

export async function saveAvatarFile(userId: number, file: File) {
  const contentType = file.type;

  if (!isSupportedAvatarMimeType(contentType)) {
    throw new Error("Unsupported avatar file type");
  }

  if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    throw new Error("Avatar file is too large");
  }

  await ensureUploadDirectories();

  const extension =
    MIME_TYPE_TO_EXTENSION[contentType] ||
    extname(file.name).toLowerCase() ||
    ".bin";
  const filename = `user-${userId}-${crypto.randomUUID()}${extension}`;
  const absolutePath = join(AVATAR_UPLOAD_DIR, filename);
  const arrayBuffer = await file.arrayBuffer();

  await writeFile(absolutePath, Buffer.from(arrayBuffer));

  return {
    absolutePath,
    publicUrl: `/uploads/avatars/${filename}`,
  };
}

export async function deleteAvatarFileByUrl(avatarUrl: string | null) {
  const filename = getFilenameFromUrl(avatarUrl);

  if (!filename) {
    return;
  }

  await rm(join(AVATAR_UPLOAD_DIR, filename), { force: true });
}
