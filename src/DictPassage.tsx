import React from 'react';
import { Chip, makeStyles } from '@material-ui/core';
import './passage.css';

const str = (text: string | null) => (text ? String(text) : '');

const useStyles = makeStyles((theme) => ({
  title: {
    marginTop: 5,
    backgroundColor: 'lightyellow',
  },
  spell: {},
  pronunciation: {},
}));

interface PhraseProps {
  node: Node; // Text or Element
  root: boolean;
  lang: string;
}

const Phrase: React.FC<PhraseProps> = ({ node, root, lang }) => {
  const classes = useStyles();

  const header = () => {
    if (node && node instanceof Element && node.tagName === 'entryFree') {
      const attrs = Object.fromEntries(
        Array.from(node.attributes).map((attr) => [attr.name, attr.nodeValue])
      );
      return (
        <div className={lang}>
          <span className={classes.spell}>{attrs.spell}</span>
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
        {str(node.nodeValue)}
      </span>
      {Array.from(node.childNodes).map((child_node, index) => (
        <Phrase key={index} node={child_node} root={false} lang={lang} />
      ))}
    </>
  );
};

interface DictPassageProps {
  title: string;
  rawText: string;
  lang: string;
}

const DictPassage: React.FC<DictPassageProps> = ({ title, rawText, lang }) => {
  const classes = useStyles();
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    '<root>' + rawText + '</root>',
    'text/xml'
  );

  return (
    <>
      <Chip
        variant="outlined"
        size="small"
        label={title}
        className={classes.title}
      />
      <br />
      {Array.from(doc.childNodes).map((node, index) => (
        <Phrase key={index} node={node} root lang={lang} />
      ))}
    </>
  );
};

export default DictPassage;
