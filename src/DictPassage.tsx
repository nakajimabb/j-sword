import React, { useEffect, useState, useContext } from 'react';
import { NodeObj, createNodeObj } from './NodeObj';
import AppContext from './AppContext';
import './passage.css';

const INVALID_CHAR =
  /[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm;

interface PhraseProps {
  nodeObj: NodeObj;
  lang: string;
  header?: boolean;
  meaning?: boolean;
  className?: string;
}

const Phrase: React.FC<PhraseProps> = ({
  nodeObj,
  lang,
  header = true,
  meaning = true,
  className,
}) => {
  const attrs = nodeObj.attrs;

  return (
    <div className={className}>
      {header && nodeObj.tag === 'entryFree' && (
        <div>
          <span className={lang}>{attrs.spell}</span>
          --
          <span>{attrs.pronunciation}</span>
        </div>
      )}
      {meaning && (
        <span className={lang} style={{ fontSize: '100%' }}>
          {nodeObj.value}
        </span>
      )}
      {nodeObj.children.map((childObj, index) => (
        <Phrase
          key={index}
          nodeObj={childObj}
          lang={lang}
          header={header}
          meaning={meaning}
        />
      ))}
    </div>
  );
};

type Props = {
  lemma: string;
  showTitle?: boolean;
  showWordCount?: boolean;
  className?: string;
};

const DictPassage: React.FC<Props> = ({
  lemma,
  showTitle = true,
  showWordCount = false,
  className,
}) => {
  const [nodeObjs, setNodeObjs] = useState<{ [modname: string]: NodeObj }>({});
  const [wordCounts, setWordCounts] = useState<{ [modname: string]: number }>(
    {}
  );
  const { dictionaries, bibles, layouts, targetHistory } =
    useContext(AppContext);
  const lang = lemma[0] === 'H' ? 'he' : 'grc';

  useEffect(() => {
    if (showWordCount) {
      const f = async () => {
        const modnames = layouts
          .flat()
          .filter((layout) => layout.type === 'bible')
          .map((layout) => layout.modname);
        const tasks = modnames.map(async (modname) => {
          const count = await bibles[modname].countWord(lemma);
          return { modname, count };
        });
        const results = await Promise.all(tasks);
        const counts: { [modname: string]: number } = {};
        results.forEach((result) => {
          if (result.count) counts[result.modname] = result.count;
        });
        setWordCounts(counts);
      };
      f();
    }
  }, [lemma, bibles, layouts, targetHistory, showWordCount]); // layouts circular dependency?

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
          {index === 0 && (
            <>
              <Phrase
                nodeObj={nodeObj}
                lang={lang}
                header={true}
                meaning={false}
                className="mb-1"
              />
              {showWordCount && (
                <div className="mx-1 mb-1">
                  <b>{lemma}</b>
                  &nbsp;
                  {Object.keys(wordCounts).map((modname, index) => (
                    <small key={index} className="px-1">
                      {`${modname}(${wordCounts[modname]})`}
                    </small>
                  ))}
                </div>
              )}
            </>
          )}
          {showTitle && (
            <div className="text-xs text-gray-700 bg-yellow-50 rounded-full border border-gray-400 px-2 w-max">
              {dictionaries[modname].title}
            </div>
          )}
          <Phrase
            nodeObj={nodeObj}
            lang={lang}
            header={false}
            meaning={true}
            className="mb-2"
          />
        </React.Fragment>
      ))}
    </div>
  );
};

export default DictPassage;
