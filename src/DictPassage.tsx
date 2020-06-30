import React from 'react';
import { Chip, makeStyles } from '@material-ui/core';
import './passage.css';

const str = (text: string | null) => (text ? String(text) : '');

const useStyles = makeStyles((theme) => ({
  title: {
    marginTop: 5,
    backgroundColor: 'lightyellow',
  },
  spell: {
    fontSize: '135%',
  },
  pronunciation: {},
}));

interface PhraseProps {
  node: Node; // Text or Element
  root: boolean;
}

const Phrase: React.FC<PhraseProps> = ({ node, root }) => {
  const classes = useStyles();

  const header = () => {
    if (node && node instanceof Element && node.tagName === 'entryFree') {
      const attrs = Object.fromEntries(
        Array.from(node.attributes).map((attr) => [attr.name, attr.nodeValue])
      );
      return (
        <div>
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
      {str(node.nodeValue)}
      {Array.from(node.childNodes).map((child_node, index) => (
        <Phrase key={index} node={child_node} root={false} />
      ))}
    </>
  );
};

interface DictPassageProps {
  title: string;
  rawText: string;
}

const DictPassage: React.FC<DictPassageProps> = ({ title, rawText }) => {
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
        <Phrase key={index} node={node} root />
      ))}
    </>
  );
};

export default DictPassage;
