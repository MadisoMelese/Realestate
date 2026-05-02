const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Converts a relative image path like /uploads/file.jpg
 * to a full URL using the backend base URL from env.
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

export const getAvatarSrc = (profileImage) => {
  if (!profileImage) return '/default-avatar.png';
  return getImageUrl(profileImage);
};
