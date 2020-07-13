import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { parseLemma } from './attr';
import { Raw } from './sword/types';
import { AnnotateType } from './AppContext';
import './passage.css';

const str = (text: string | null) => (text ? String(text) : '');

interface PhraseProps {
  node: Node; // Text or Element
  parent?: Node; // Text or Element
  root: boolean;
  target_lemma?: string;
  setAnnotate: React.Dispatch<AnnotateType>;
  enable_hover: boolean;
  setEnableHover: React.Dispatch<boolean>;
  lang: string;
}

const Phrase: React.FC<PhraseProps> = ({
  node,
  parent,
  root,
  target_lemma,
  setAnnotate,
  enable_hover,
  setEnableHover,
  lang,
}) => {
  const [lemma, setLemma] = useState<string | null>(null);
  const excepts = ['note'];

  useEffect(() => {
    if (
      target_lemma &&
      parent &&
      parent instanceof Element &&
      parent.attributes
    ) {
      const attrs: Attr[] = Array.from(parent.attributes);
      const attr_lemma: Attr | undefined = attrs.find(
        (attr: Attr) => attr.name === 'lemma'
      );
      if (attr_lemma) {
        const lemma = parseLemma(attr_lemma);
        if (lemma) setLemma(lemma);
      }
    }
  }, [parent]);

  const clearHighlight = (class_name: string) => {
    const elems = document.getElementsByClassName(class_name);
    for (const elem of Array.from(elems)) {
      elem.classList.remove(class_name);
    }
  };

  const onClick = (e: React.MouseEvent) => {
    onMouseOver(e);
    setEnableHover(!enable_hover);
  };

  const onMouseOver = async (e: React.MouseEvent) => {
    const excepts = ['type', 'subType', 'gloss'];
    if (enable_hover && node instanceof Element) {
      if (!node.attributes || node.attributes.length === 0) return;
      const attrs: Attr[] = Array.from(node.attributes);
      let attributes = attrs.filter((attr) => !excepts.includes(attr.name));

      if (attrs && attrs.length > 0 && node.textContent) {
        e.currentTarget.classList.add('highlight2');
        setAnnotate({ content: node.textContent, attributes, lang });
      }
    }
  };

  const onMouseLeave = () => {
    if (enable_hover) {
      clearHighlight('highlight2');
    }
  };

  const renderData = () => {
    const attributes =
      parent instanceof Element ? Array.from(parent.attributes) : [];
    const gloss = attributes.find((attr: Attr) => attr.name === 'gloss');
    if (gloss) {
      return (
        <ruby>
          {str(node.nodeValue)}
          <rp>（</rp>
          <rt>{gloss.value}</rt>
          <rp>）</rp>
        </ruby>
      );
    } else {
      return <>{str(node.nodeValue)}</>;
    }
  };

  const contents = () => (
    <>
      {renderData()}
      {Array.from(node.childNodes).map((child_node, index) => (
        <Phrase
          key={index}
          node={child_node}
          parent={node}
          root={false}
          setAnnotate={setAnnotate}
          enable_hover={enable_hover}
          setEnableHover={setEnableHover}
          target_lemma={target_lemma}
          lang={lang}
        />
      ))}
    </>
  );

  if (node instanceof Element && excepts.includes(node.tagName)) return null;

  return root ? (
    contents()
  ) : (
    <div
      className={clsx('phrase', node instanceof Element && node.tagName)}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
      style={target_lemma && lemma === target_lemma ? { color: 'red' } : {}}
    >
      {contents()}
    </div>
  );
};

interface PassageProps {
  raw: Raw;
  setAnnotate: React.Dispatch<AnnotateType>;
  enable_hover: boolean;
  setEnableHover: React.Dispatch<boolean>;
  show_verse: boolean;
  target_lemma?: string;
  lang: string;
}

const Passage: React.FC<PassageProps> = ({
  raw,
  setAnnotate,
  enable_hover,
  setEnableHover,
  show_verse = true,
  target_lemma,
  lang,
}) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    '<root>' + raw.text + '</root>',
    'text/xml'
  );

  return (
    <>
      {show_verse && raw.verse > 0 && <div className="verse">{raw.verse}.</div>}
      {Array.from(doc.childNodes).map((node, index) => (
        <Phrase
          key={index}
          node={node}
          setAnnotate={setAnnotate}
          enable_hover={enable_hover}
          setEnableHover={setEnableHover}
          target_lemma={target_lemma}
          root
          lang={lang}
        />
      ))}
    </>
  );
};

export default Passage;
