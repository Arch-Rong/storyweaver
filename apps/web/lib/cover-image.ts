const MAX_COVER_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateCoverFile(file: File): string | null {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return "仅支持 JPG、PNG、WebP 格式的图片。";
  }

  if (file.size > MAX_COVER_BYTES) {
    return "封面图片不能超过 2MB。";
  }

  return null;
}

export function readCoverFileAsDataUrl(file: File): Promise<string> {
  const validationError = validateCoverFile(file);
  if (validationError) {
    return Promise.reject(new Error(validationError));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("无法读取图片文件。"));
    };
    reader.onerror = () => reject(new Error("无法读取图片文件。"));
    reader.readAsDataURL(file);
  });
}
