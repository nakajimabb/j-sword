import React, { useEffect, useState, useContext } from 'react';
import { Chip, makeStyles } from '@material-ui/core';
import { NodeObj, createNodeObj } from './NodeObj';
import AppContext from './AppContext';
import './passage.css';
import clsx from 'clsx';

const useStyles = makeStyles((theme) => ({
  title: {
    marginTop: 5,
    backgroundColor: 'lightyellow',
  },
  spell: {},
  pronunciation: {},
}));

interface PhraseProps {
  nodeObj: NodeObj;
  lang: string;
}

const Phrase: React.FC<PhraseProps> = ({ nodeObj, lang }) => {
  const classes = useStyles();

  const header = () => {
    if (nodeObj.tag === 'entryFree') {
      const attrs = nodeObj.attrs;
      return (
        <div>
          <span className={clsx(lang, classes.spell)}>{attrs.spell}</span>
          --
          <span className={classes.pronunciation}>{attrs.pronunciation}</span>
        </div>
      );
    }
  };
  return (
    <>
      {header()}
      <span className={lang} style={{ fontSize: '100%' }}>
        {nodeObj.value}
      </span>
      {nodeObj.children.map((childObj, index) => (
        <Phrase key={index} nodeObj={childObj} lang={lang} />
      ))}
    </>
  );
};

interface DictPassageProps {
  lemma: string;
  lang: string;
}

const DictPassage: React.FC<DictPassageProps> = ({ lemma, lang }) => {
  const [nodeObjs, setNodeObjs] = useState<{ [modname: string]: NodeObj }>({});
  const { dictionaries } = useContext(AppContext);
  const classes = useStyles();

  useEffect(() => {
    const f = async () => {
      if (lemma) {
        const tasks = Object.entries(dictionaries).map(
          async ([modname, dictionary]) => {
            const rawText = await dictionary.getRawText(lemma);
            return { modname, rawText };
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
  }, [lemma]);

  if (!lemma) return null;

  return (
    <>
      {Object.entries(nodeObjs).map(([modname, nodeObj], index) => (
        <React.Fragment key={index}>
          <Chip
            variant="outlined"
            size="small"
            label={dictionaries[modname].title}
            className={classes.title}
          />
          <br />
          <Phrase nodeObj={nodeObj} lang={lang} />
        </React.Fragment>
      ))}
    </>
  );
};

export default DictPassage;
