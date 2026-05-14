import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback, useRef } from 'react'
import {
  FiBold, FiItalic, FiUnderline, FiList, FiAlignLeft, FiAlignCenter,
  FiAlignRight, FiLink, FiCode, FiMinus, FiType, FiChevronDown,
} from 'react-icons/fi'

interface RichHtmlEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

function ToolbarButton({ active, onClick, children, title, disabled }: {
  active?: boolean; onClick: () => void; children: React.ReactNode; title: string; disabled?: boolean
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-all
        ${active ? 'bg-lz-accent/20 text-lz-accent' : 'text-gray-400 hover:bg-white/10 hover:text-white'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="mx-0.5 h-6 w-px bg-white/10" />
}

export default function RichHtmlEditor({ value, onChange, placeholder }: RichHtmlEditorProps) {
  const suppressUpdate = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'not-prose' } },
      }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-lz-accent underline' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing…' }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[300px] px-5 py-4 ' +
          'prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white ' +
          'prose-a:text-lz-accent prose-blockquote:border-l-lz-accent prose-blockquote:text-gray-400 ' +
          'prose-code:text-cyan-300 prose-code:bg-white/5 prose-code:rounded prose-code:px-1 prose-code:py-0.5 ' +
          'prose-code:before:content-none prose-code:after:content-none ' +
          'prose-li:text-gray-300 prose-li:marker:text-lz-accent/70 ' +
          'prose-hr:border-white/10',
      },
    },
    onUpdate({ editor: e }) {
      if (suppressUpdate.current) return
      onChange(e.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) {
      suppressUpdate.current = true
      editor.commands.setContent(value || '', { emitUpdate: false })
      suppressUpdate.current = false
    }
  }, [value, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href
    const url = window.prompt('URL', prev || 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  const headingLevel = editor.isActive('heading', { level: 1 }) ? 1
    : editor.isActive('heading', { level: 2 }) ? 2
    : editor.isActive('heading', { level: 3 }) ? 3 : 0

  const headingLabel = headingLevel ? `H${headingLevel}` : 'Text'

  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 bg-[#12151c] px-2 py-1.5">
        {/* Heading dropdown */}
        <div className="relative group">
          <button type="button"
            className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all">
            <FiType size={13} />
            <span className="hidden sm:inline">{headingLabel}</span>
            <FiChevronDown size={11} />
          </button>
          <div className="absolute left-0 top-full z-20 mt-1 hidden min-w-[140px] rounded-lg border border-white/10 bg-[#12151c] py-1 shadow-xl group-hover:block">
            <button type="button" onClick={() => editor.chain().focus().setParagraph().run()}
              className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${!headingLevel ? 'text-lz-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              Normal text
            </button>
            {([1, 2, 3] as const).map((l) => (
              <button key={l} type="button" onClick={() => editor.chain().focus().toggleHeading({ level: l }).run()}
                className={`block w-full px-3 py-1.5 text-left transition-colors ${headingLevel === l ? 'text-lz-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                style={{ fontSize: l === 1 ? 15 : l === 2 ? 13 : 12, fontWeight: 600 }}>
                Heading {l}
              </button>
            ))}
          </div>
        </div>

        <ToolbarDivider />

        <ToolbarButton title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <FiBold size={14} />
        </ToolbarButton>
        <ToolbarButton title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <FiItalic size={14} />
        </ToolbarButton>
        <ToolbarButton title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <FiUnderline size={14} />
        </ToolbarButton>
        <ToolbarButton title="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <span className="text-[13px]">H</span>
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <FiList size={14} />
        </ToolbarButton>
        <ToolbarButton title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <span className="text-[11px] font-bold">1.</span>
        </ToolbarButton>
        <ToolbarButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <span className="text-[14px] font-serif">"</span>
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <FiAlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <FiAlignCenter size={14} />
        </ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <FiAlignRight size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
          <FiLink size={14} />
        </ToolbarButton>
        <ToolbarButton title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          <FiCode size={14} />
        </ToolbarButton>
        <ToolbarButton title="Horizontal rule" active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <FiMinus size={14} />
        </ToolbarButton>
      </div>

      {/* Bubble menu for selected text */}
      {editor && (
        <BubbleMenu editor={editor}
          className="flex items-center gap-0.5 rounded-lg border border-white/15 bg-[#12151c] p-1 shadow-xl">
          <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <FiBold size={13} />
          </ToolbarButton>
          <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <FiItalic size={13} />
          </ToolbarButton>
          <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <FiUnderline size={13} />
          </ToolbarButton>
          <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
            <FiLink size={13} />
          </ToolbarButton>
        </BubbleMenu>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />

      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #4b5563;
          pointer-events: none;
          height: 0;
        }
        .tiptap:focus { outline: none; }
        .tiptap mark { background: rgba(0, 212, 255, 0.2); color: white; padding: 1px 3px; border-radius: 3px; }
      `}</style>
    </div>
  )
}
