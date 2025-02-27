export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const API_ROUTES = {
    MESSAGES: "/messages",
    TAGS: "/tags",
    MESSAGE_TAGS: "/message_tags"
}
export const MAX_IMAGE_SIZE_MB = import.meta.env.VITE_MAX_IMAGE_SIZE_MB;  // Set the maximum size limit in MB
export const ALLOWED_IMAGE_FORMATS = import.meta.env.VITE_ALLOWED_IMAGE_FORMATS;  // Only allow PNG and JPEG images
export const DEFAULT_IMAGE = import.meta.env.VITE_DEFAULT_IMAGE;
export const ALLOWED_VIDEO_FORMATS = import.meta.env.VITE_ALLOWED_VIDEO_FORMATS;  // Only allow MP4 videos
export const DEFAULT_VIDEO = import.meta.env.VITE_DEFAULT_VIDEO;
