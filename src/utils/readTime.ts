import { stripHtml } from './html';

export function calculateReadTime(text: string): number {
  const wordsPerMinute = 200;
  const plainText = stripHtml(text);
  const words = plainText.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return minutes;
}
