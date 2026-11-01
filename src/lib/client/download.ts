/** How long a generated download URL stays valid; long enough for the download to start. */
const REVOKE_DELAY_MS = 1_000;

/**
 * Saves generated text as a file in the browser. The link is attached to the document because
 * some browsers only honour downloads from links in the page, and the object URL is revoked
 * shortly after so it does not leak.
 * @param fileName - suggested file name.
 * @param content - file contents.
 * @param type - MIME type, including charset.
 */
export function downloadText(fileName: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, REVOKE_DELAY_MS);
}
