export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

export function stripHtmlForSpeech(html: string): string {
  const spacedHtml = html.replace(/<\/(p|div|h[1-6]|li)>/gi, '. ');
  const doc = new DOMParser().parseFromString(spacedHtml, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim();
}

