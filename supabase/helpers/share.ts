export function shareContent(type: string, id: string, title: string, description?: string) {
  const url = `${window.location.origin}/${type}/${id}`;
  if (navigator.share) {
    navigator.share({ title, text: description || title, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url)
      .then(() => alert('Link copied to clipboard!'))
      .catch(() => alert('Copy link: ' + url));
  }
}