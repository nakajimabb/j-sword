import React, { useState, useEffect, useContext } from 'react';
import { Box, makeStyles } from '@material-ui/core';
import clsx from 'clsx';
import BibleReference from './BibleReference';
import AppContext, { AnnotateType } from './AppContext';
import { References } from './sword/types';

const useStyles = makeStyles((theme) => ({
  header: {
    marginBottom: 5,
    display: 'flex',
  },
  item: {
    marginRight: 5,
    alignSelf: 'center',
  },
  morph: {
    fontSize: '85%',
    marginBottom: 5,
  },
  spell: {
    fontSize: '110%',
    marginBottom: 5,
  },
  dict: {
    marginBottom: 10,
  },
  meaning: {
    fontSize: '85%',
  },
  content: {
    // height: 'calc(100vh - 68px)',
    // height: 'calc(100vh - 120px)',
    // overflow: 'scroll',
  },
  pane: {
    overflow: 'scroll',
    padding: theme.spacing(2),
    textAlign: 'left',
    width: '100%',
    height: 'calc(100vh - 120px)',
    dislay: 'flex',
    flexDirection: 'column',
  },
}));

interface AnnotateProps {
  annotate: AnnotateType;
}

const Annotate: React.FC<AnnotateProps> = ({
  annotate: { content, attributes },
}) => {
  const [dict_items, setDictItems] = useState<string[]>([]);
  const [references, setReferences] = useState<References>({});
  const [morph, setMorph] = useState<string>('');
  const [infos, setInfos] = useState<{ morph: string; lemma: string }>({
    morph: '',
    lemma: '',
  });
  const enable_annotate = !!content || attributes.length > 0;
  const { bibles, dictionaries, morphologies } = useContext(AppContext);
  const classes = useStyles();

  useEffect(() => {
    const f = async () => {
      attributes.forEach(async (attr) => {
        if (attr.name === 'lemma') {
          const reg = /strong:([GH])(\d+)/;
          const values = attr?.value?.split(' ');
          if (values) {
            const value = values?.find((s: string) => s.match(reg));
            const m = value?.match(reg);
            if (m && m[1] && m[2]) {
              const lemma = m[1] + ('0000' + +m[2]).slice(-4); // ４桁
              let items = [];
              for (let modname in dictionaries) {
                const raw_text = await dictionaries[modname].getRawText(lemma);
                if (raw_text) items.push(raw_text);
              }
              setDictItems(items);
              setInfos((prev) => ({ ...prev, lemma }));
              let new_references: References = {};
              for (let modname in bibles) {
                const reference = await bibles[modname].getReference(lemma);
                if (reference) new_references[modname] = reference;
              }
              setReferences(new_references);
            }
          }
        } else if (attr.name == 'morph') {
          const reg = /(\w+):([\w-.]+)/;
          const values = attr?.value?.split(' ');
          const value = values?.find((s: string) => s.match(reg));
          const m = value?.match(reg);
          if (m && m[1] && m[2]) {
            let items = [];
            for (let modname in morphologies) {
              const raw_text = await morphologies[modname].getRawText(m[2]);
              if (raw_text) items.push(raw_text);
            }
            setInfos((prev) => ({ ...prev, morph: m[2] }));
            if (items.length > 0) {
              setMorph(items[0]);
            } else {
              if (value) setMorph(value);
            }
          }
        }
      });
    };
    f();
  }, [content, attributes]);

  if (!enable_annotate)
    return <Box className={clsx('content', classes.content)}></Box>;

  return (
    <Box className={clsx('content', classes.content)}>
      <div className={classes.header}>
        <div className={classes.item} style={{ fontSize: '135%' }}>
          {content}
        </div>
        <div className={classes.item}>
          {infos.lemma && '(' + infos.lemma + ')'}
        </div>
        <div className={classes.item}>{infos.morph && ' ' + infos.morph}</div>
        <div className={classes.item}>
          <BibleReference
            word={content}
            lemma={infos.lemma}
            references={references}
          />
        </div>
      </div>
      {morph && <div className={classes.morph}>{morph}</div>}
      {dict_items.map((dict, index: number) => (
        <div key={index} className={classes.dict}>
          <div className={classes.meaning}>{dict}</div>
        </div>
      ))}
    </Box>
  );
};

export default Annotate;
