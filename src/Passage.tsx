import React, { useEffect, useState, useContext } from 'react';
import clsx from 'clsx';
import { str } from './tools';
import { Raw } from './sword/types';
import { NodeObj, createNodeObj, shapeLemma } from './NodeObj';
import AppContext from './AppContext';
import './passage.css';

const colors = [
  'text-red-600',
  'text-yellow-500',
  'text-pink-400',
  'text-red-800',
  'text-purple-600',
  'text-green-500',
];

type PhraseProps = {
  nodeObj: NodeObj;
  lang: string;
};

const MuiPhrase: React.FC<PhraseProps> = ({ nodeObj, lang }) => {
  const { targetWord, setTargetWord, touchDevice } = useContext(AppContext);
  const excepts = ['note'];
  const attrs = nodeObj.attrs;

  if (excepts.includes(nodeObj.tag)) return null;

  const textValue = (node_obj: NodeObj) => {
    let text = node_obj.value;
    node_obj.children.forEach((child) => (text += textValue(child)));
    return text;
  };

  const clearHighlight = (class_name: string) => {
    const elems = document.getElementsByClassName(class_name);
    for (const elem of Array.from(elems)) {
      elem.classList.remove(class_name);
    }
  };

  const onClick = (e: React.MouseEvent) => {
    onMouseOver(e);
    if (targetWord.lemma && !touchDevice) {
      setTargetWord({ ...targetWord, fixed: !targetWord.fixed });
    }
  };

  const currentLemma = () => {
    if (attrs.hasOwnProperty('lemma') && attrs.lemma) {
      let lemma: string = attrs.lemma.split(':').pop() || '';
      if (lemma) lemma = shapeLemma(lemma);
      return lemma;
    } else {
      return '';
    }
  };

  const onMouseOver = async (e: React.MouseEvent) => {
    // const excepts = ['type', 'subType', 'gloss'];
    if (
      !targetWord.fixed &&
      (attrs.hasOwnProperty('lemma') || attrs.hasOwnProperty('morph'))
    ) {
      e.currentTarget.classList.add('highlight2');
      let lemma: string = str(attrs.lemma).split(':').pop() || '';
      if (lemma) lemma = shapeLemma(lemma);

      let morph: string = str(attrs.morph).split(' ').shift() || '';
      morph = str(morph).split(':').pop() || '';

      setTargetWord({
        ...targetWord,
        morph,
        lemma,
        text: textValue(nodeObj),
      });
    }
  };

  const onMouseLeave = () => {
    clearHighlight('highlight2');
  };

  // const renderData = () => {
  //   const attributes =
  //     parent instanceof Element ? Array.from(parent.attributes) : [];
  //   const gloss = attributes.find((attr: Attr) => attr.name === 'gloss');
  //   if (gloss) {
  //     return (
  //       <ruby>
  //         {str(node.nodeValue)}
  //         <rp>（</rp>
  //         <rt>{gloss.value}</rt>
  //         <rp>）</rp>
  //       </ruby>
  //     );
  //   } else {
  //     return <>{str(node.nodeValue)}</>;
  //   }
  // };

  const curLemma = currentLemma();
  const lemmas = targetWord.lemma.split(/[,&]/).map((lem) => shapeLemma(lem));
  const color = lemmas.findIndex((lemma) => lemma && lemma === curLemma);

  const contents = () => (
    <span>
      {/* {renderData()} */}
      {nodeObj.value}
      {nodeObj.children.map((childObj, index) =>
        childObj.tag !== '#text' ? (
          <Phrase key={index} nodeObj={childObj} lang={lang} />
        ) : (
          <React.Fragment key={index}>{childObj.value}</React.Fragment>
        )
      )}
    </span>
  );

  return nodeObj.tag === 'root' ? (
    contents()
  ) : (
    <div
      className={clsx('phrase', colors[color], nodeObj.tag)}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
    >
      {contents()}
    </div>
  );
};

const Phrase = React.memo(
  MuiPhrase,
  ({ nodeObj: prevObj }, { nodeObj: nextObj }) => {
    return prevObj.value === nextObj.value && prevObj.attrs === nextObj.attrs;
  }
);

interface PassageProps {
  raw: Raw;
  showPosition: 'chapter verse' | 'verse' | 'none';
  target_lemma?: string;
  lang: string;
}

const MuiPassage: React.FC<PassageProps> = ({ raw, showPosition, lang }) => {
  const [nodeObj, setNodeObj] = useState<NodeObj>({
    tag: 'root',
    value: '',
    attrs: {},
    children: [],
  });

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      '<root>' + raw.text + '</root>',
      'text/xml'
    );
    if (doc.childNodes.length > 0) {
      setNodeObj(createNodeObj(doc.childNodes[0]));
    } else {
      setNodeObj({
        tag: 'root',
        value: '',
        attrs: {},
        children: [],
      });
    }
  }, [raw.text]);

  const getPosition = (osisRef: string) => {
    const m = osisRef.match(/(\d+):(\d+)$/);
    if (m) {
      if (showPosition === 'chapter verse') {
        return m[0];
      } else if (showPosition === 'verse') {
        return m[2];
      }
    }
  };

  return (
    <>
      {<div className={showPosition}>{getPosition(raw.osisRef)}</div>}
      <Phrase nodeObj={nodeObj} lang={lang} />
    </>
  );
};

const Passage = React.memo(MuiPassage, ({ raw: prevRaw }, { raw: nextRaw }) => {
  return prevRaw.text === nextRaw.text;
});

export default Passage;
