import React, { useEffect, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { EnterAsLineBreak } from '../extensions/EnterAsLineBreak';
import { Pagination } from '../extensions/Pagination';
import { templates, toEditorHtml } from '../templates/templates';
import '../styles/editor.css';

const Editor: React.FC = () => {
    const [activeTemplateId, setActiveTemplateId] = useState(templates[0]?.id ?? '');
    const activeTemplate = useMemo(
        () => templates.find(template => template.id === activeTemplateId) ?? templates[0],
        [activeTemplateId]
    );

    const editor = useEditor({
        extensions: [
            EnterAsLineBreak,
            StarterKit,
            Pagination.configure({
                pageHeight: 1122,
                pageMarginTop: 40,
                pageMarginBottom: 40,
                headerHeight: 10,
                footerHeight: 10,
                pageGap: 50,
                triggerBufferPx: 2,
            }),
        ],
        content: activeTemplate ? toEditorHtml(activeTemplate.rawHtml) : '<p></p>',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
            },
            handleScrollToSelection: () => true,
        },
    });

    useEffect(() => {
        if (!editor || !activeTemplate) return;
        editor.commands.setContent(toEditorHtml(activeTemplate.rawHtml), { emitUpdate: false });
    }, [activeTemplate, editor]);

    return (
        <div className="editor-container">
            <div className="editor-layout">
                <aside className="templates-panel">
                    <h2 className="templates-title">Templates</h2>
                    <div className="templates-list">
                        {templates.map(template => {
                            const isActive = template.id === activeTemplateId;
                            return (
                                <button
                                    key={template.id}
                                    type="button"
                                    className={`template-item${isActive ? ' is-active' : ''}`}
                                    onClick={() => setActiveTemplateId(template.id)}
                                >
                                    {template.name}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <div className="editor-surface">
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
};

export default Editor;
