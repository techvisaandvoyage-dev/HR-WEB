import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const defaultToolbar = [
  [{ header: [1, 2, 3, false] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  ['blockquote', 'code-block'],
  ['clean']
];

const modules = {
  toolbar: defaultToolbar,
};

const formats = [
  'header',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'align',
  'list',
  'bullet',
  'indent',
  'blockquote',
  'code-block',
  'clean'
];

const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Write here...',
  minHeight = '180px',
  className = ''
}) => {
  return (
    <div className={`rich-text-editor-container rounded-xl overflow-hidden border border-gray-200 bg-white focus-within:border-[#29953f] focus-within:ring-1 focus-within:ring-[#29953f]/20 transition-all ${className}`}>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ minHeight }}
      />
      <style>{`
        .rich-text-editor-container .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid #f3f4f6;
          background-color: #f9fafb;
          padding: 8px 10px;
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
        }
        .rich-text-editor-container .ql-container.ql-snow {
          border: none;
          font-family: inherit;
          font-size: 14px;
        }
        .rich-text-editor-container .ql-editor {
          min-height: ${minHeight};
          padding: 14px 16px;
          line-height: 1.6;
          color: #1f2937;
        }
        .rich-text-editor-container .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
          left: 16px;
          right: 16px;
        }
        .rich-text-editor-container .ql-snow.ql-toolbar button:hover,
        .rich-text-editor-container .ql-snow .ql-toolbar button:hover,
        .rich-text-editor-container .ql-snow.ql-toolbar button:focus,
        .rich-text-editor-container .ql-snow .ql-toolbar button:focus,
        .rich-text-editor-container .ql-snow.ql-toolbar button.ql-active,
        .rich-text-editor-container .ql-snow .ql-toolbar button.ql-active,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-label:hover,
        .rich-text-editor-container .ql-snow .ql-toolbar .ql-picker-label:hover,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-label.ql-active,
        .rich-text-editor-container .ql-snow .ql-toolbar .ql-picker-label.ql-active,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-item:hover,
        .rich-text-editor-container .ql-snow .ql-toolbar .ql-picker-item:hover,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-selected,
        .rich-text-editor-container .ql-snow .ql-toolbar .ql-picker-item.ql-selected {
          color: #29953f;
        }
        .rich-text-editor-container .ql-snow.ql-toolbar button:hover .ql-stroke,
        .rich-text-editor-container .ql-snow .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor-container .ql-snow.ql-toolbar button:focus .ql-stroke,
        .rich-text-editor-container .ql-snow .ql-toolbar button:focus .ql-stroke,
        .rich-text-editor-container .ql-snow.ql-toolbar button.ql-active .ql-stroke,
        .rich-text-editor-container .ql-snow .ql-toolbar button.ql-active .ql-stroke,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke,
        .rich-text-editor-container .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke,
        .rich-text-editor-container .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke,
        .rich-text-editor-container .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke,
        .rich-text-editor-container .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke {
          stroke: #29953f;
        }
        .rich-text-editor-container .ql-snow.ql-toolbar button:hover .ql-fill,
        .rich-text-editor-container .ql-snow .ql-toolbar button:hover .ql-fill,
        .rich-text-editor-container .ql-snow.ql-toolbar button:focus .ql-fill,
        .rich-text-editor-container .ql-snow .ql-toolbar button:focus .ql-fill,
        .rich-text-editor-container .ql-snow.ql-toolbar button.ql-active .ql-fill,
        .rich-text-editor-container .ql-snow .ql-toolbar button.ql-active .ql-fill,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-label:hover .ql-fill,
        .rich-text-editor-container .ql-snow .ql-toolbar .ql-picker-label:hover .ql-fill,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-fill,
        .rich-text-editor-container .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-fill,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-item:hover .ql-fill,
        .rich-text-editor-container .ql-snow .ql-toolbar .ql-picker-item:hover .ql-fill,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-fill,
        .rich-text-editor-container .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-fill {
          fill: #29953f;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
