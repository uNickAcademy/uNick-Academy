// Extracts the 11-char video ID from common YouTube URL shapes
// (youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID).
export function youtubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}
