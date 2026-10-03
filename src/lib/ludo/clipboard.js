export async function copyToClipboard(text) {
  if (typeof window === 'undefined' || !text) return false;

  // Try modern navigator.clipboard API if available (requires Secure Context)
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('navigator.clipboard.writeText failed, trying fallback:', e);
    }
  }

  // Fallback for HTTP / non-secure contexts / unsupported browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error('Fallback copy error:', err);
    return false;
  }
}
