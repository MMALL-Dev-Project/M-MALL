const BASE_STORAGE = "https://csitasavsenhjprwwdup.supabase.co/storage/v1/object/public/";

// 썸네일 이미지 유틸
export const getThumbnailSrc = (thumb) => {
  const thumbUrl = BASE_STORAGE + "products/thumbnails/";
  const defaultThumb = thumbUrl + "default-image.png";

  if (!thumb) return defaultThumb;

  return thumb?.startsWith(thumbUrl) ? thumb : `${thumbUrl}${thumb}`;
};