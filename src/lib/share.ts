// src/lib/share.ts

/**
 * Share content with native Web Share API or fallback to clipboard copy.
 * @param type - The type of content ('video', 'story', 'group', 'dadaz', etc.)
 * @param id - The unique ID of the content
 * @param title - Title of the content (used for share dialog)
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
    // Fallback: copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => alert('Could not copy link. Please copy manually: ' + url));
    } else {
      // Older browsers: prompt with the link
      prompt('Copy this link:', url);
    }
  }
}