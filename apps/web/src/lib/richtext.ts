/**
 * Minimal Lexical (Payload richText) -> HTML converter.
 * Handles the node types produced by the default lexical editor: paragraphs,
 * headings, lists, quotes, links, line breaks and inline text formatting.
 * Unknown nodes fall back to rendering their children.
 */

interface LexicalNode {
  type: string;
  version?: number;
  children?: LexicalNode[];
  [k: string]: unknown;
}

interface LexicalRoot {
  root: LexicalNode;
}

const IS_BOLD = 1;
const IS_ITALIC = 1 << 1;
const IS_STRIKETHROUGH = 1 << 2;
const IS_UNDERLINE = 1 << 3;
const IS_CODE = 1 << 4;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderText(node: LexicalNode): string {
  let text = escapeHtml(String(node.text ?? ''));
  const format = Number(node.format ?? 0);
  if (format & IS_CODE) text = `<code>${text}</code>`;
  if (format & IS_BOLD) text = `<strong>${text}</strong>`;
  if (format & IS_ITALIC) text = `<em>${text}</em>`;
  if (format & IS_UNDERLINE) text = `<u>${text}</u>`;
  if (format & IS_STRIKETHROUGH) text = `<s>${text}</s>`;
  return text;
}

function renderChildren(node: LexicalNode): string {
  return (node.children ?? []).map(renderNode).join('');
}

function renderNode(node: LexicalNode): string {
  switch (node.type) {
    case 'text':
      return renderText(node);
    case 'linebreak':
      return '<br />';
    case 'paragraph': {
      const inner = renderChildren(node);
      return inner ? `<p>${inner}</p>` : '';
    }
    case 'heading': {
      const tag = (node.tag as string) || 'h2';
      return `<${tag}>${renderChildren(node)}</${tag}>`;
    }
    case 'quote':
      return `<blockquote>${renderChildren(node)}</blockquote>`;
    case 'list': {
      const tag = node.listType === 'number' ? 'ol' : 'ul';
      return `<${tag}>${renderChildren(node)}</${tag}>`;
    }
    case 'listitem':
      return `<li>${renderChildren(node)}</li>`;
    case 'link':
    case 'autolink': {
      const fields = (node.fields as Record<string, unknown>) ?? {};
      const url = escapeHtml(String(fields.url ?? node.url ?? '#'));
      const target = fields.newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${url}"${target}>${renderChildren(node)}</a>`;
    }
    case 'horizontalrule':
      return '<hr />';
    default:
      return renderChildren(node);
  }
}

export function richTextToHtml(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const root = (value as LexicalRoot).root;
  if (!root) return '';
  return renderChildren(root);
}

/** Plain-text extraction (for excerpts / meta descriptions). */
export function richTextToPlain(value: unknown, max = 200): string {
  const html = richTextToHtml(value);
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
