/**
 * Reads MkDocs site_url from config text (one assignment line; not a full YAML parse)
 * and returns the URL pathname used as the serve prefix, without a trailing slash.
 */
export function siteUrlPathPrefixFromYaml(text: string): string {
  const match = text.match(/^[ \t]*site_url:[ \t]*(.*)$/m);
  if (!match) {
    return '';
  }
  return pathnameFromSiteUrl(unquoteYamlScalar(match[1]));
}

export function prefixSitePath(sitePath: string, prefix: string): string {
  const normalized = prefix.replace(/\/+$/, '');
  if (normalized === '' || normalized === '/') {
    return sitePath;
  }
  const base = normalized.startsWith('/') ? normalized : `/${normalized}`;
  if (sitePath === '/' || sitePath === '') {
    return `${base}/`;
  }
  return `${base}${sitePath.startsWith('/') ? sitePath : `/${sitePath}`}`;
}

function unquoteYamlScalar(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1);
  }
  const comment = trimmed.indexOf(' #');
  if (comment >= 0) {
    return trimmed.slice(0, comment).trim();
  }
  return trimmed;
}

function pathnameFromSiteUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') {
    return '';
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    try {
      const pathname = new URL(trimmed).pathname.replace(/\/+$/, '');
      return pathname === '' || pathname === '/' ? '' : pathname;
    } catch {
      return '';
    }
  }
  const pathOnly = trimmed.replace(/\/+$/, '');
  if (pathOnly === '' || pathOnly === '/') {
    return '';
  }
  return pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
}
