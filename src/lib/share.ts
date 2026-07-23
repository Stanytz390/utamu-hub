// src/lib/share.ts

/**
 * Share content using native Web Share API or fallback to clipboard copy.
 * @param type - The content type ('video', 'story', 'group', 'dadaz', etc.)
 * @param id - The unique ID of the content
 * @param title - Title for the share dialog
 * @param description - Optional description
 */
export function shareContent(type: string, id: string, title: string, description?: string) {
  const url = `${window.location.origin}/${type}/${id}`;
  const shareData = {
    title,
    text: description || title,
    url,
  };

  if (navigator.share) {
    navigator.share(shareData).catch(() => { /* User cancelled */ });
  } else {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => alert('Could not copy link. Please copy manually: ' + url));
    } else {
      prompt('Copy this link:', url);
    }
  }
}