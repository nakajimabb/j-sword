import React, { useEffect, useState, useContext } from 'react';
import clsx from 'clsx';
import { str } from './tools';
import { Raw } from './sword/types';
import { NodeObj, createNodeObj, shapeLemma } from './NodeObj';
import AppContext from './AppContext';
import './passage.css';

interface PhraseProps {
  nodeObj: NodeObj;
  target_lemma?: string;
  lang: string;
  depth: number;
}

const MuiPhrase: React.FC<PhraseProps> = ({
  nodeObj,
  target_lemma,
  lang,
  depth,
}) => {
  const { targetWords, setTargetWords, touchDevice } = useContext(AppContext);
  const excepts = ['note'];
  const word = targetWords[depth];
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
    if (word.lemma && !touchDevice) {
      let words = [...targetWords];
      words[depth] = {
        ...word,
        fixed: !word.fixed,
      };
      if (!target_lemma)
        words[depth].targetLemma = word.fixed ? '' : word.lemma;
      setTargetWords(words);
    }
  };

  const currentLemma = () => {
    if (attrs.hasOwnProperty('lemma') && attrs.lemma) {
      let lemma: string = attrs.lemma.split(':').pop() || '';
      if (lemma) lemma = shapeLemma(lemma, lang);
      return lemma;
    } else {
      return '';
    }
  };

  const onMouseOver = async (e: React.MouseEvent) => {
    // const excepts = ['type', 'subType', 'gloss'];
    if (
      !word.fixed &&
      (attrs.hasOwnProperty('lemma') || attrs.hasOwnProperty('morph'))
    ) {
      e.currentTarget.classList.add('highlight2');
      let lemma: string = str(attrs.lemma).split(':').pop() || '';
      if (lemma) lemma = shapeLemma(lemma, lang);
      let morph: string = str(attrs.morph).split(' ').shift() || '';
      morph = str(morph).split(':').pop() || '';

      let words = [...targetWords];
      const cur_word = {
        ...word,
        morph,
        lemma,
        lang,
        text: textValue(nodeObj),
      };
      if (!target_lemma) cur_word.targetLemma = lemma;

      const next_word = { ...cur_word, targetLemma: lemma };
      words[depth] = cur_word;
      if (words.length > depth) {
        words[depth + 1] = next_word;
      } else {
        words.push(next_word);
      }
      setTargetWords(words);
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

  const contents = () => (
    // <span style={lemma === word.targetLemma ? { color: 'red' } : {}}>
    <span>
      {/* {renderData()} */}
      {nodeObj.value}
      {nodeObj.children.map((childObj, index) =>
        childObj.tag !== '#text' ? (
          <Phrase
            key={index}
            nodeObj={childObj}
            target_lemma={target_lemma}
            lang={lang}
            depth={depth}
          />
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
      className={clsx('phrase', nodeObj.tag)}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
      style={
        word.targetLemma && curLemma === word.targetLemma
          ? { color: 'red' }
          : {}
      }
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
  depth: number;
}

const MuiPassage: React.FC<PassageProps> = ({
  raw,
  showPosition,
  target_lemma,
  lang,
  depth,
}) => {
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
      <Phrase
        nodeObj={nodeObj}
        target_lemma={target_lemma}
        lang={lang}
        depth={depth}
      />
    </>
  );
};

const Passage = React.memo(MuiPassage, ({ raw: prevRaw }, { raw: nextRaw }) => {
  return prevRaw.text === nextRaw.text;
});

export default Passage;
