import React, { useState, useEffect, useContext } from 'react';
import { Box, Checkbox, Grid, makeStyles } from '@material-ui/core';
import { PinDrop, PinDropOutlined } from '@material-ui/icons';
import BibleReference from './BibleReference';
import DictPassage from './DictPassage';
import MorphPassage from './MorphPassage';
import AppContext from './AppContext';

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

interface DictViewProp {
  depth: number;
}

const DictView: React.FC<DictViewProp> = ({ depth }) => {
  const { targetWords, setTargetWords } = useContext(AppContext);
  const word = targetWords[depth];
  const { text: wordText, lang, lemma, morph, fixed } = word;
  const classes = useStyles();

  useEffect(() => {
    // 次の要素が存在しなければ前もって追加しておく
    if (targetWords.length <= depth + 1) {
      setTargetWords([...targetWords, targetWords[targetWords.length - 1]]);
    }
  }, []);

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
      <Box mb={1}>
        <BibleReference lemma={lemma} depth={depth + 1} />
      </Box>
      <Box mb={1} className={classes.dict}>
        <DictPassage lemma={lemma} lang={lang} />
      </Box>
    </Box>
  );
};

export default DictView;
