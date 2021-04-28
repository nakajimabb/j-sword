import React, { useEffect, useState, useContext } from 'react';
import { NodeObj, createNodeObj } from './NodeObj';
import AppContext from './AppContext';
import './passage.css';

const INVALID_CHAR = /[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm;

interface PhraseProps {
  nodeObj: NodeObj;
  lang: string;
  className?: string;
}

const Phrase: React.FC<PhraseProps> = ({ nodeObj, lang, className }) => {
  const header = () => {
    if (nodeObj.tag === 'entryFree') {
      const attrs = nodeObj.attrs;
      return (
        <div>
          <span className={lang}>{attrs.spell}</span>
          --
          <span>{attrs.pronunciation}</span>
        </div>
      );
    }
  };

  return (
    <div className={className}>
      {header()}
      <span className={lang} style={{ fontSize: '100%' }}>
        {nodeObj.value}
      </span>
      {nodeObj.children.map((childObj, index) => (
        <Phrase key={index} nodeObj={childObj} lang={lang} />
      ))}
    </div>
  );
};

interface DictPassageProps {
  lemma: string;
  lang: string;
  className?: string;
}

const DictPassage: React.FC<DictPassageProps> = ({
  lemma,
  lang,
  className,
}) => {
  const [nodeObjs, setNodeObjs] = useState<{ [modname: string]: NodeObj }>({});
  const { dictionaries } = useContext(AppContext);

  useEffect(() => {
    const f = async () => {
      if (lemma) {
        const tasks = Object.entries(dictionaries).map(
          async ([modname, dictionary]) => {
            const rawText = await dictionary.getRawText(lemma);
            return { modname, rawText: rawText.replace(INVALID_CHAR, '') };
          }
        );
        let node_objs: { [modname: string]: NodeObj } = {};
        const result = await Promise.all(tasks);
        result.forEach(({ modname, rawText }) => {
          if (rawText) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(
              '<root>' + rawText + '</root>',
              'text/xml'
            );
            if (doc.childNodes.length > 0) {
              node_objs[modname] = createNodeObj(doc.childNodes[0]);
            }
          }
        });
        setNodeObjs(node_objs);
      } else {
        setNodeObjs({});
      }
    };
    f();
  }, [lemma, dictionaries]);

  if (!lemma) return null;

  return (
    <div className={className}>
      {Object.entries(nodeObjs).map(([modname, nodeObj], index) => (
        <React.Fragment key={index}>
          <div className="text-xs bg-yellow-50 rounded-full border border-gray-400 px-2 py-0.5 w-max">
            {dictionaries[modname].title}
          </div>
          <Phrase nodeObj={nodeObj} lang={lang} className="mb-4" />
        </React.Fragment>
      ))}
    </div>
  );
};

export default DictPassage;
