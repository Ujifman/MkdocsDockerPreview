const MARKER = 'Documentation built';

export function scanDocumentationBuilt(
  pending: string,
  chunk: string,
): { ready: boolean; pending: string } {
  const combined = pending + chunk;
  if (combined.includes(MARKER)) {
    return { ready: true, pending: '' };
  }
  const keep = MARKER.length - 1;
  return { ready: false, pending: combined.slice(-keep) };
}
