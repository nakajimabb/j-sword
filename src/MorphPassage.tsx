import React from 'react';
import './passage.css';

const str = (text: string | null) => (text ? String(text) : '');

interface PhraseProps {
  node: Node; // Text or Element
}

const Phrase: React.FC<PhraseProps> = ({ node }) => {
  return (
    <>
      {str(node.nodeValue)}
      {node instanceof Element && node.tagName === 'lb' && (
        <>&thinsp;/&thinsp;</>
      )}
      {Array.from(node.childNodes).map((child_node, index) => (
        <Phrase key={index} node={child_node} />
      ))}
    </>
  );
};

interface MorphPassageProps {
  rawText: string;
}

const MorphPassage: React.FC<MorphPassageProps> = ({ rawText }) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    '<root>' + rawText + '</root>',
    'text/xml'
  );

  return (
    <>
      {Array.from(doc.childNodes).map((node, index) => (
        <Phrase key={index} node={node} />
      ))}
    </>
  );
};

export default MorphPassage;
