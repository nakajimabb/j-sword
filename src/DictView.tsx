import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Checkbox,
  Grid,
  IconButton,
  TextField,
  makeStyles,
} from '@material-ui/core';
import {
  PinDrop,
  PinDropOutlined,
  ChevronLeft,
  ChevronRight,
} from '@material-ui/icons';
import BibleReference from './BibleReference';
import DictPassage from './DictPassage';
import MorphPassage from './MorphPassage';
import AppContext from './AppContext';
import { shapeLemma } from './NodeObj';

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
  input: {
    width: 70,
  },
}));

interface DictViewProp {
  depth: number;
}

const DictView: React.FC<DictViewProp> = ({ depth }) => {
  const [shapedLemma, setShapedLemma] = useState<string>('');
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

  useEffect(() => {
    const m = lemma.match(/(\d+)/);
    if (m && m[1]) {
      const newLemma = shapeLemma(m[1], lang);
      setShapedLemma(newLemma);
    }
  }, [lemma]);

  const reverseFixed = () => {
    let words = [...targetWords];
    words[depth] = { ...word, fixed: !word.fixed };
    setTargetWords(words);
  };

  const changeLemma = (newLemma: string) => {
    let words = [...targetWords];
    const new_word = { ...word, lemma: newLemma, text: '', morph: '' };
    const next_word = { ...new_word, targetLemma: newLemma };
    words[depth] = new_word;
    if (words.length > depth) {
      words[depth + 1] = next_word;
    } else {
      words.push(next_word);
    }
    setTargetWords(words);
  };

  const incrementLemma = (inc: number) => () => {
    const m = lemma.match(/(\d+)/);
    if (m && m[1]) {
      const number = +m[1] + inc;
      if (number > 0) {
        const newLemma = shapeLemma(String(number), lang);
        changeLemma(newLemma);
      }
    }
  };

  const onChangeLemma = (e: React.ChangeEvent<{ value: unknown }>) => {
    changeLemma(String(e.currentTarget.value));
  };

  return (
    <Box>
      {lemma && (
        <Box m={0}>
          <Grid
            container
            direction="row"
            justify="space-between"
            alignItems="center"
          >
            <Grid item>
              <IconButton size="small" onClick={incrementLemma(-1)}>
                <ChevronLeft />
              </IconButton>
              <TextField
                value={lemma}
                size="small"
                onChange={onChangeLemma}
                className={classes.input}
              />
              <IconButton size="small" onClick={incrementLemma(1)}>
                <ChevronRight />
              </IconButton>
            </Grid>
            <Grid item>
              <BibleReference lemma={shapedLemma} depth={depth + 1} />
              <Checkbox
                checked={fixed}
                icon={<PinDropOutlined />}
                checkedIcon={<PinDrop />}
                className={classes.item}
                onChange={reverseFixed}
                style={{ marginLeft: 5 }}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {wordText && lemma && (
        <Box mb={0}>
          <span className={lang} style={{ fontSize: '180%' }}>
            {wordText}
          </span>
        </Box>
      )}

      <Box mb={1}>
        <MorphPassage morph={morph} />
      </Box>

      <Box mb={1} className={classes.dict}>
        <DictPassage lemma={shapedLemma} lang={lang} />
      </Box>
    </Box>
  );
};

export default DictView;
