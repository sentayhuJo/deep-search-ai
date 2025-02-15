import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import LoadingSpinner from './LoadingSpinner';
import { ReactNode } from 'react';

interface ResearchReportProps {
  readonly loading: boolean;
  readonly finalReport: string;
}

interface MarkdownComponentProps {
  children: ReactNode | ReactNode[];
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  onClick?: React.MouseEventHandler;
  onKeyDown?: React.KeyboardEventHandler;
  role?: string;
  tabIndex?: number;
}

const MarkdownComponents = {
  h1: ({ children }: MarkdownComponentProps) => (
    <h1 className="text-2xl font-bold mb-6 text-gray-900">{children}</h1>
  ),
  h2: ({ children }: MarkdownComponentProps) => (
    <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-800">{children}</h2>
  ),
  h3: ({ children }: MarkdownComponentProps) => (
    <h3 className="text-lg font-medium mt-6 mb-3 text-gray-800">{children}</h3>
  ),
  p: ({ children, ...props }: MarkdownComponentProps) => (
    <p className="mb-4 leading-relaxed text-gray-700" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: MarkdownComponentProps) => (
    <ul className="my-4 list-disc pl-6 text-gray-700 [&_strong]:text-gray-900" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: MarkdownComponentProps) => (
    <ol className="my-4 list-decimal pl-6 text-gray-700" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: MarkdownComponentProps) => (
    <li className="mb-2 text-gray-700 [&_strong]:text-gray-900" {...props}>{children}</li>
  ),
  blockquote: ({ children, ...props }: MarkdownComponentProps) => (
    <blockquote className="border-l-4 pl-4 italic my-4 text-gray-600" {...props}>{children}</blockquote>
  ),
  strong: ({ children }: MarkdownComponentProps) => (
    <strong className="font-bold text-gray-900">{children}</strong>
  ),
};

export function ResearchReport({ loading, finalReport }: ResearchReportProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Generating your report...</p>
        </div>
      </div>
    );
  }
  
  if (finalReport) {
    return (
      <div className="prose prose-slate max-w-none dark:prose-invert">
        <ReactMarkdown 
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
          components={MarkdownComponents}
        >
          {finalReport}
        </ReactMarkdown>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <p>Your research report will appear here</p>
    </div>
  );
} 