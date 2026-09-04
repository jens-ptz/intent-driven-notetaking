import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

/**
 * Renders a note body.
 *
 * `rehype-raw` is deliberately not installed anywhere in this repository, and
 * `rehype-sanitize` runs with its default schema, so author-supplied HTML and
 * scripts can never reach the page (ADR-0006). Sanitization happens here at
 * render time, so the stored note stays exactly what its author typed.
 */
export function Markdown({ children }: { children: string }): JSX.Element {
  return (
    <div data-testid="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
