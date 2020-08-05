import React, { useState, useEffect } from 'react';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import htmlToDraft from 'html-to-draftjs';

export const EditorConvertToHTML = ({ html, setHtml }) => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  useEffect(() => {
    const contentBlock = htmlToDraft(html);
    const contentState = ContentState.createFromBlockArray(
      contentBlock.contentBlocks
    );
    const editor_state = EditorState.createWithContent(contentState);
    setEditorState(editor_state);
  }, [html]);

  const onEditorStateChange = (editor_state) => {
    setEditorState(editor_state);
    setHtml(draftToHtml(convertToRaw(editorState.getCurrentContent())));
  };

  return (
    <div>
      <Editor
        editorState={editorState}
        wrapperClassName="demo-wrapper"
        editorClassName="demo-editor"
        onEditorStateChange={onEditorStateChange}
        style={{ width: '100%', height: '200px' }}
      />
      <textarea
        disabled={false}
        value={draftToHtml(convertToRaw(editorState.getCurrentContent()))}
        style={{ width: '100%', height: '200px' }}
      />
    </div>
  );
};
