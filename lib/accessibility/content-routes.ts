/** Routes with long-form content where reading controls have an effect. */
const CONTENT_ROOTS = ["articles", "blog", "glossary", "projects", "tutorials"];

export function isReaderRoute(pathname: string): boolean {
  const [root, slug] = pathname.split("/").filter(Boolean);
  return CONTENT_ROOTS.includes(root ?? "") && Boolean(slug);
}
