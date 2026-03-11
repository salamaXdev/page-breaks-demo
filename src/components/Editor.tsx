import React, { useEffect, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { EnterAsLineBreak } from '../extensions/EnterAsLineBreak';
import { Pagination } from '../extensions/Pagination';
import { templates, toEditorHtml } from '../templates/templates';
import '../styles/editor.css';

const TEMPLATE_API_BASE_URL = 'https://api.savant-api.online/api/v1/template-management/templates';

const Editor: React.FC = () => {
    const urlTemplateId = useMemo(() => {
        const idFromQuery = new URLSearchParams(window.location.search).get('id')?.trim();
        return idFromQuery ? idFromQuery : null;
    }, []);

    const [activeTemplateId, setActiveTemplateId] = useState(templates[0]?.id ?? '');
    const [apiTemplateHtml, setApiTemplateHtml] = useState<string | null>(null);
    const [isApiTemplateLoading, setIsApiTemplateLoading] = useState(false);
    const [apiTemplateError, setApiTemplateError] = useState<string | null>(null);

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
        if (!urlTemplateId) {
            setApiTemplateHtml(null);
            setApiTemplateError(null);
            setIsApiTemplateLoading(false);
            return;
        }

        let isCanceled = false;
        const controller = new AbortController();

        const fetchTemplateFromApi = async () => {
            setIsApiTemplateLoading(true);
            setApiTemplateError(null);

            try {
                const response = await fetch(
                    `${TEMPLATE_API_BASE_URL}/${encodeURIComponent(urlTemplateId)}/formatted`,
                    {
                        method: 'GET',
                        headers: {
                            Accept: 'text/html,text/plain;q=0.9,*/*;q=0.8',
                        },
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const html = await response.text();
                if (!isCanceled) {
                    setApiTemplateHtml(html);
                }
            } catch (error: unknown) {
                if (isCanceled) return;
                if (error instanceof DOMException && error.name === 'AbortError') return;

                setApiTemplateHtml(null);
                setApiTemplateError(error instanceof Error ? error.message : 'Failed to load template.');
            } finally {
                if (!isCanceled) {
                    setIsApiTemplateLoading(false);
                }
            }
        };

        void fetchTemplateFromApi();

        return () => {
            isCanceled = true;
            controller.abort();
        };
    }, [urlTemplateId]);

    useEffect(() => {
        if (!editor) return;

        if (urlTemplateId && apiTemplateHtml) {
            editor.commands.setContent(toEditorHtml(apiTemplateHtml), { emitUpdate: false });
            return;
        }

        if (activeTemplate) {
            editor.commands.setContent(toEditorHtml(activeTemplate.rawHtml), { emitUpdate: false });
        }
    }, [activeTemplate, apiTemplateHtml, editor, urlTemplateId]);

    return (
        <div className="editor-container">
            <div className="editor-layout">
                <aside className="templates-panel">
                    <h2 className="templates-title">Templates</h2>
                    {urlTemplateId && (
                        <p className="template-source-note">
                            {isApiTemplateLoading
                                ? `Loading template "${urlTemplateId}" from API...`
                                : apiTemplateHtml
                                    ? `Loaded template "${urlTemplateId}" from API.`
                                    : `Using local templates (API template id "${urlTemplateId}" not loaded).`}
                        </p>
                    )}
                    {apiTemplateError && <p className="template-error">{apiTemplateError}</p>}
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
