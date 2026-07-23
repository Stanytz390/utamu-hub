// src/lib/share.ts
export function shareContent(type: string, id: string, title: string, description?: string) {
  const url = `${window.location.origin}/${type}/${id}`;
  const shareData = {
    title,
    text: description || title,
    url,
  };

  if (navigator.share) {
    navigator.share(shareData).catch(() => { /* user cancelled */ });
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