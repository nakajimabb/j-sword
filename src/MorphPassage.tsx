import React, { useEffect, useState, useContext } from 'react';
import { NodeObj, createNodeObj } from './NodeObj';
import AppContext from './AppContext';
import './passage.css';

interface PhraseProps {
  nodeObj: NodeObj;
}

const Phrase: React.FC<PhraseProps> = ({ nodeObj }) => {
  return (
    <>
      {nodeObj.value}
      {nodeObj.children.map((childObj, index) => (
        <Phrase key={index} nodeObj={childObj} />
      ))}
    </>
  );
};

interface MorphPassageProps {
  morph: string;
}

const initNodeObj = {
  tag: 'root',
  value: '',
  attrs: {},
  children: [],
};

const MorphPassage: React.FC<MorphPassageProps> = ({ morph }) => {
  const [nodeObj, setNodeObj] = useState<NodeObj>(initNodeObj);
  const { morphologies } = useContext(AppContext);

  useEffect(() => {
    const f = async () => {
      if (morph) {
        const reg = /(\w+):([\w/]+)/;
        const values = morph.split(' ');
        const value = values?.find((s: string) => s.match(reg));
        const m = value?.match(reg);
        if (m && m[1] && m[2]) {
          const tasks = Object.entries(morphologies).map(
            async ([modname, morphology]) => {
              const raw_text = await morphology.getRawText(m[2]);
              return { modname, raw_text };
            }
          );
          const result = await Promise.all(tasks);
          const raw_texts = result
            .map(({ modname, raw_text }) => raw_text)
            .filter((raw_text) => !!raw_text);
          if (raw_texts.length > 0) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(
              '<root>' + raw_texts[0] + '</root>',
              'text/xml'
            );
            if (doc.childNodes.length > 0) {
              setNodeObj(createNodeObj(doc.childNodes[0]));
            } else {
              setNodeObj(initNodeObj);
            }
          } else {
            setNodeObj(initNodeObj);
          }
        }
      } else {
        setNodeObj(initNodeObj);
      }
    };
    f();
  }, [morph]);

  if (!morph) return null;

  return (
    <>
      [{morph}] <Phrase nodeObj={nodeObj} />
    </>
  );
};

export default MorphPassage;
