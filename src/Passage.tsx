import React, { useEffect, useState, useContext } from 'react';
import clsx from 'clsx';
import { str, zeroPadding } from './tools';
import { Raw } from './sword/types';
import AppContext from './AppContext';
import './passage.css';

const shapeLemma = (lemma: string) => {
  const reg = /([GH])(\d+)/;
  const m = lemma.match(reg);
  return m && m[1] && m[2] ? m[1] + zeroPadding(+m[2], 4) : '';
};

interface NodeObj {
  tag: string;
  value: string;
  attrs: { [key: string]: string };
  children: NodeObj[];
}

interface PhraseProps {
  nodeObj: NodeObj; // Text or Element
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
  const { targetWords, setTargetWords } = useContext(AppContext);
  const excepts = ['note'];
  const word = targetWords[depth];
  const attrs = nodeObj.attrs;

  if (excepts.includes(nodeObj.tag)) return null;

  const textValue = (node_obj: NodeObj) => {
    let text = node_obj.value;
    node_obj.children.forEach((child) => (text += textValue(child)));
    return text;
  };

  // useEffect(() => {
  //   if (
  //     target_lemma &&
  //     parent &&
  //     parent instanceof Element &&
  //     parent.attributes
  //   ) {
  //     const attrs: Attr[] = Array.from(parent.attributes);
  //     const attr_lemma: Attr | undefined = attrs.find(
  //       (attr: Attr) => attr.name === 'lemma'
  //     );
  //     if (attr_lemma) {
  //       const lemma = parseLemma(attr_lemma);
  //       if (lemma) {
  //         console.log({ lemma });
  //         setLemma(lemma);
  //         setTargetWords([
  //           { ...targetDictItem[0], lemma },
  //           ...targetDictItem,
  //         ]);
  //       }
  //     }
  //   }
  // }, [parent]);

  const clearHighlight = (class_name: string) => {
    const elems = document.getElementsByClassName(class_name);
    for (const elem of Array.from(elems)) {
      elem.classList.remove(class_name);
    }
  };

  const onClick = (e: React.MouseEvent) => {
    onMouseOver(e);
    if (word.lemma) {
      let words = [...targetWords];
      words[depth] = { ...word, fixed: !word.fixed };
      setTargetWords(words);
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
      !word.fixed &&
      (attrs.hasOwnProperty('lemma') || attrs.hasOwnProperty('morph'))
    ) {
      e.currentTarget.classList.add('highlight2');
      let lemma: string = str(attrs.lemma).split(':').pop() || '';
      if (lemma) lemma = shapeLemma(lemma);
      let morph = str(attrs.morph);

      let words = [...targetWords];
      const cur_word = {
        ...word,
        morph,
        lemma,
        lang,
        text: textValue(nodeObj),
      };
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
          <>{childObj.value}</>
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
  show_verse: boolean;
  target_lemma?: string;
  lang: string;
  depth: number;
}

const MuiPassage: React.FC<PassageProps> = ({
  raw,
  show_verse = true,
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

  const createNodeObj = (node: Node): NodeObj => {
    let obj = createSelfNodeObj(node);
    node.childNodes.forEach((child) => {
      obj.children.push(createNodeObj(child));
    });
    return obj;
  };

  const createSelfNodeObj = (node: Node): NodeObj => {
    const attrs =
      node instanceof Element && node.attributes
        ? Object.assign(
            {},
            ...Array.from(node.attributes).map((attr) => ({
              [attr.name]: attr.nodeValue,
            }))
          )
        : {};
    return {
      tag: node.nodeName,
      value: str(node.nodeValue),
      attrs: attrs,
      children: [],
    };
  };

  return (
    <>
      {show_verse && raw.verse > 0 && <div className="verse">{raw.verse}.</div>}
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
