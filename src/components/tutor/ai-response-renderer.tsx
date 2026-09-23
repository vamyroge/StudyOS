"use client";

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import type { NormalizedAIResponse } from "@/lib/ai/orchestrator/guardrails";

export function AIResponseRenderer({ response }: { response: Pick<NormalizedAIResponse, "content" | "mode"> }) {
  // Code mode: render as code block
  if (response.mode === "code") {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed bg-muted p-3 rounded-md">
        <code>{response.content}</code>
      </pre>
    );
  }

  // Default: render with Markdown + Math support
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Customize rendering
          p: ({ children }) => <p className="text-sm leading-relaxed mb-3 last:mb-0">{children}</p>,
          
          // Code blocks
          code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
              return <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>;
            }
            return (
              <pre className="overflow-x-auto bg-muted p-3 rounded-md mb-3">
                <code className={className} {...props}>{children}</code>
              </pre>
            );
          },
          
          // Headings
          h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>,
          
          // Lists
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
          
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse border border-border">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border px-3 py-2 bg-muted font-semibold text-left text-sm">{children}</th>,
          td: ({ children }) => <td className="border border-border px-3 py-2 text-sm">{children}</td>,
          
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-3">
              {children}
            </blockquote>
          ),
          
          // Links
          a: ({ href, children }) => (
            <a href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          
          // Horizontal rule
          hr: () => <hr className="my-4 border-border" />,
        }}
      >
        {response.content}
      </ReactMarkdown>
    </div>
  );
}
