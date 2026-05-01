export function buildAbsoluteUrl(req: Request, path: string | null) {
  if (!path) {
    return null;
  }

  const url = new URL(req.url);
  return `${url.origin}${path}`;
}
