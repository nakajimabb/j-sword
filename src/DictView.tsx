import React, { useEffect, useContext } from 'react';
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
  pane: {
    overflow: 'scroll',
    padding: theme.spacing(2),
    textAlign: 'left',
    width: '100%',
    height: 'calc(100vh - 120px)',
    dislay: 'flex',
    flexDirection: 'column',
  },
  input: {
    width: 70,
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

  const incLemma = (inc: number) => () => {
    let words = [...targetWords];
    const m = lemma.match(/(\d+)/);
    if (m && m[1]) {
      const number = +m[1] + inc;
      if (number > 0) {
        const newLemma = shapeLemma(String(number), lang);
        words[depth] = { ...word, lemma: newLemma, text: '', morph: '' };
        setTargetWords(words);
      }
    }
  };

  const changeLemma = (e: React.ChangeEvent<{ value: unknown }>) => {
    let words = [...targetWords];
    const newLemma = shapeLemma(String(e.currentTarget.value), lang);
    words[depth] = { ...word, lemma: newLemma, text: '', morph: '' };
    setTargetWords(words);
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
              <IconButton size="small" onClick={incLemma(-1)}>
                <ChevronLeft />
              </IconButton>
              <TextField
                value={lemma}
                size="small"
                onChange={changeLemma}
                className={classes.input}
              />
              <IconButton size="small" onClick={incLemma(1)}>
                <ChevronRight />
              </IconButton>
            </Grid>
            <Grid item>
              <BibleReference lemma={lemma} depth={depth + 1} />
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
        <DictPassage lemma={lemma} lang={lang} />
      </Box>
    </Box>
  );
};

export default DictView;
