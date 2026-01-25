import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

const flattenChildren = (children: any): string => {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(flattenChildren).join('');
  if (children?.props?.children) return flattenChildren(children.props.children);
  return '';
};

const CodeBlock = ({ children, className }: any) => {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace('language-', '') || 'code';

  const rawText = useMemo(() => flattenChildren(children), [children]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block my-4 overflow-hidden rounded-lg border border-[#E8E2D9] bg-white shadow-sm max-w-full">
      <div className="flex items-center justify-between px-4 py-2 bg-[#F8F5F1] border-b border-[#E8E2D9] text-neutral-500">
        <div className="flex items-center space-x-2">
          <Terminal size={12} className="text-neutral-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest">{lang}</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="touch-target p-2 hover:bg-neutral-100 rounded-md transition-all text-neutral-400 hover:text-neutral-800"
          title="Copy"
        >
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="overflow-x-auto p-4 font-mono text-xs md:text-sm leading-relaxed text-neutral-800 scrollbar-thin scrollbar-thumb-neutral-200">
        <code className={className}>{children}</code>
      </div>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-content w-full serif-body text-neutral-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            return !inline ? (
              <CodeBlock className={className}>{children}</CodeBlock>
            ) : (
              <code className="bg-[#F3EFE9] px-1.5 py-0.5 rounded text-[#002147] font-mono text-[0.85em]">
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-lg border border-[#E8E2D9] bg-white">
                <table className="w-full text-sm text-left">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-[#F8F5F1] text-neutral-600 font-semibold border-b border-[#E8E2D9]">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-4 py-3 font-semibold">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-3 border-b border-neutral-50 last:border-b-0">{children}</td>;
          },
          p({ children }) {
            return <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc ml-6 mb-4 space-y-2">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal ml-6 mb-4 space-y-2">{children}</ol>;
          },
          h1({ children }) {
            return <h1 className="text-2xl font-bold mb-4 text-[#002147] mt-6 serif-heading">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold mb-3 text-[#002147] mt-5 serif-heading">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-bold mb-2 text-[#002147] mt-4 serif-heading">{children}</h3>;
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#002147] font-medium underline decoration-[#D1CBC3] underline-offset-4 hover:decoration-[#002147] transition-all">
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-[#D1CBC3] pl-4 italic text-neutral-600 my-4 bg-[#F8F5F1]/50 py-2 pr-2">
                {children}
              </blockquote>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};