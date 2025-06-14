import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import RenderImage from './RenderImage';
import CodeBlock from './CodeBlock';

const MarkdownRenderer = ({ content }) => {
  // Custom renderer cho markdown
  const MarkdownComponents = {
    // Xử lý image để tránh lỗi nested DOM
    img: ({ node, ...props }) => {
      return <RenderImage src={props.src} alt={props.alt} />;
    },

    // Override p để ngăn các thành phần không hợp lệ bên trong
    p: ({ node, children, ...props }) => {
      // Kiểm tra nếu children có chứa RenderImage
      const hasSpecialChild = React.Children.toArray(children).some(
        child => React.isValidElement(child) &&
          (child.type === RenderImage || child.props?.src)
      );

      // Nếu có special child, chỉ render children
      if (hasSpecialChild) {
        return <>{children}</>;
      }

      // Nếu không, render như paragraph bình thường
      return <p {...props}>{children}</p>;
    },

    table: ({ node, ...props }) => {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border-collapse border border-gray-300 rounded-lg">
            {props.children}
          </table>
        </div>
      );
    },
    thead: ({ node, ...props }) => {
      return <thead className="bg-mint-50">{props.children}</thead>;
    },
    th: ({ node, ...props }) => {
      return <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">{props.children}</th>;
    },
    td: ({ node, ...props }) => {
      return <td className="border border-gray-300 px-4 py-2 text-gray-700">{props.children}</td>;
    },
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <CodeBlock
          language={match[1]}
          value={String(children).replace(/\n$/, '')}
        />
      ) : (
        <code className={`${className} bg-gray-100 px-1 py-0.5 rounded text-gray-800`} {...props}>
          {children}
        </code>
      );
    },
    blockquote: ({ node, ...props }) => {
      return (
        <blockquote className="border-l-4 border-mint-500 pl-4 italic text-gray-700 my-4">
          {props.children}
        </blockquote>
      );
    },
    li: ({ node, ...props }) => {
      return <li className="mb-1">{props.children}</li>;
    }
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={MarkdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;