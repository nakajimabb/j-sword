import React, { useState, useEffect, useContext } from 'react';
import { Box, Checkbox, Grid, makeStyles } from '@material-ui/core';
import { PinDrop, PinDropOutlined } from '@material-ui/icons';
import BibleReference from './BibleReference';
import DictPassage from './DictPassage';
import MorphPassage from './MorphPassage';
import AppContext from './AppContext';
import { References } from './sword/types';
import clsx from 'clsx';

const useStyles = makeStyles((theme) => ({
  header: {
    marginBottom: 5,
    display: 'flex',
  },
  item: {
    marginRight: 5,
    alignSelf: 'center',
    '&:last-child': {
      marginLeft: 'auto',
    },
  },
  spell: {
    fontSize: '110%',
    marginBottom: 5,
  },
  dict: {
    whiteSpace: 'pre-wrap',
  },
  meaning: {
    fontSize: '85%',
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

interface DictItem {
  modname: string;
  title: string;
  rawText: string;
}

interface DictViewProp {
  depth: number;
}

const DictView: React.FC<DictViewProp> = ({ depth }) => {
  const [dictItems, setDictItems] = useState<DictItem[]>([]);
  const [references, setReferences] = useState<References>({});
  const { bibles, dictionaries, targetWords, setTargetWords } = useContext(
    AppContext
  );
  const word = targetWords[depth];
  const { text: wordText, lang, lemma, morph, fixed } = word;
  const classes = useStyles();

  useEffect(() => {
    // 次の要素が存在しなければ前もって追加しておく
    if (targetWords.length <= depth + 1) {
      setTargetWords([...targetWords, targetWords[targetWords.length - 1]]);
    }
  }, []);

  useEffect(() => {
    const f = async () => {
      if (lemma) {
        const tasks = Object.entries(dictionaries).map(
          async ([modname, dictionary]) => {
            const rawText = await dictionary.getRawText(lemma);
            if (rawText) {
              return {
                modname: modname,
                title: dictionary.title,
                rawText: rawText,
              };
            } else {
              return null;
            }
          }
        );
        const result = await Promise.all(tasks);
        const dict_items = result.filter((item): item is DictItem => !!item);
        setDictItems(dict_items);

        const tasks2 = Object.entries(bibles).map(async ([modname, bible]) => {
          const reference = await bible.getReference(lemma);
          return { modname, reference };
        });
        const result2 = await Promise.all(tasks2);
        let new_references: References = {};
        result2.forEach(({ modname, reference }) => {
          if (reference) new_references[modname] = reference;
        });
        setReferences(new_references);
      } else {
        setReferences({});
      }
    };
    f();
  }, [targetWords[depth]?.lemma]);

  const reverseFixed = () => {
    let words = [...targetWords];
    words[depth] = { ...word, fixed: !word.fixed };
    setTargetWords(words);
  };

  return (
    <Box>
      {wordText && lemma && (
        <Grid
          container
          direction="row"
          justify="space-between"
          alignItems="center"
        >
          <Grid item>
            <span className={lang} style={{ fontSize: '180%' }}>
              {wordText}
            </span>
            &nbsp;({lemma})
          </Grid>
          <Grid item>
            <Checkbox
              checked={fixed}
              icon={<PinDropOutlined />}
              checkedIcon={<PinDrop />}
              className={classes.item}
              onChange={reverseFixed}
              style={{ textAlignLast: 'right' }}
            />
          </Grid>
        </Grid>
      )}
      <Box mb={1}>
        <MorphPassage morph={morph} />
      </Box>
      {lemma && (
        <Box mb={1}>
          <BibleReference
            depth={depth + 1}
            lemma={lemma}
            references={references}
          />
        </Box>
      )}
      {dictItems.map((item, index: number) => (
        <Box key={index} mb={1} className={classes.dict}>
          <DictPassage rawText={item.rawText} title={item.title} lang={lang} />
        </Box>
      ))}
    </Box>
  );
};

export default DictView;
