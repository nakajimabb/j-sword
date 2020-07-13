import React, { useState, useEffect, useContext } from 'react';
import {
  Chip,
  Dialog,
  Divider,
  Box,
  Container,
  Card,
  Grid,
  FormControl,
  Typography,
  CardContent,
  Select,
  MenuItem,
  makeStyles,
} from '@material-ui/core';
import Pagination from '@material-ui/lab/Pagination';
import Sword from './sword/Sword';
import Passage from './Passage';
import Annotate from './Annotate';
import AppContext, { AnnotateType } from './AppContext';
import { Raw, References } from './sword/types';
import './passage.css';
import clsx from 'clsx';

const str = (text: string | null) => (text ? String(text) : '');

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
  },
  dialog: {
    height: '100%',
    width: '100%',
    maxWidth: 'initial',
  },
  card_container: {
    backgroundColor: 'whitesmoke',
    maxWidth: 'initial',
    paddingTop: 5,
    paddingBottom: 5,
  },
  card: {
    marginTop: 5,
    marginBottom: 5,
  },
  card_content: {
    paddingBottom: '5px !important',
  },
  chip: {
    padding: 0,
    margin: 2,
    height: 'initial',
  },
  pane: {
    overflow: 'scroll',
    padding: theme.spacing(2),
    textAlign: 'left',
    width: '100%',
    height: 'calc(100vh - 150px)',
    dislay: 'flex',
    flexDirection: 'column',
  },
  passage: {
    padding: 10,
    fontSize: '100%',
    borderBottom: 'lightgray solid 1px',
    '&:last-child': { borderBottom: 'none' },
  },
}));

const countByModKey = (references: References) => {
  let sum: { [modname: string]: { [book: string]: number } } = {};
  for (let modname in references) {
    if (modname !== 'lemma') {
      sum[modname] = countByBook(modname, references);
    }
  }
  return sum;
};

const countByBook = (modKey: string, references: References) => {
  let sum: { [book: string]: number } = {};
  for (let book in references[modKey]) {
    for (let chapter in references[modKey][book]) {
      if (!sum.hasOwnProperty(book)) sum[book] = 0;
      for (let verse in references[modKey][book][chapter]) {
        sum[book] += references[modKey][book][chapter][verse];
      }
    }
  }
  return sum;
};

interface RefPassageProps {
  bible: Sword;
  raw: Raw;
  target_lemma: string;
  setAnnotate: React.Dispatch<AnnotateType>;
  enable_hover: boolean;
  setEnableHover: React.Dispatch<boolean>;
}

const RefPassage: React.FC<RefPassageProps> = ({
  bible,
  raw,
  target_lemma,
  setAnnotate,
  enable_hover,
  setEnableHover,
}) => {
  const classes = useStyles();
  const conf = bible.conf;
  const direction = conf?.Direction === 'RtoL' && 'rtl';
  const lang = String(conf?.Lang);
  console.log({ bible, lang });

  return (
    <Box className={clsx(direction, lang, classes.passage)}>
      <Passage
        raw={raw}
        show_verse={false}
        target_lemma={target_lemma}
        setAnnotate={setAnnotate}
        enable_hover={enable_hover}
        setEnableHover={setEnableHover}
        lang={lang}
      />
    </Box>
  );
};

type RawTexts = { [pos: string]: { [modname: string]: Raw[] } };

interface RefPassagesProps {
  indexes: string[];
  mod_key: string;
  lemma: string;
  setAnnotate: React.Dispatch<AnnotateType>;
}

const RefPassages: React.FC<RefPassagesProps> = ({
  indexes,
  mod_key,
  lemma,
  setAnnotate,
}) => {
  const [raw_texts, setRawTexts] = useState<RawTexts>({});
  const [enable_hover, setEnableHover] = useState<boolean>(true);
  const { bibles, target } = useContext(AppContext);
  const mod_keys = Array.from(new Set([mod_key].concat(target.mod_keys)));
  const classes = useStyles();

  useEffect(() => {
    const f = async () => {
      let new_raw_texts: RawTexts = {};
      for (const book_pos of indexes) {
        new_raw_texts[book_pos] = {};
        for (const modKey of mod_keys) {
          try {
            const raws = await bibles[modKey].renderText(book_pos, {
              footnotes: false,
              crossReferences: true,
              oneVersePerLine: true,
              headings: true,
              wordsOfChristInRed: true,
              intro: true,
              array: false,
            });
            if (raws) new_raw_texts[book_pos][modKey] = raws;
          } catch (error) {
            console.log(error);
          }
        }
      }
      setRawTexts(new_raw_texts);
    };
    f();
  }, [indexes, target.mod_keys, mod_key]);

  return (
    <Container className={classes.card_container}>
      {indexes.map((book_pos: string, key: number) => (
        <Card key={key} className={classes.card}>
          <CardContent className={classes.card_content}>
            <Box>
              <b>{book_pos}</b>
            </Box>
            <Box>
              {mod_keys.map(
                (modKey) =>
                  raw_texts[book_pos] &&
                  raw_texts[book_pos][modKey] &&
                  raw_texts[book_pos][modKey].map((raw) => {
                    return (
                      <RefPassage
                        bible={bibles[modKey]}
                        raw={raw}
                        target_lemma={lemma}
                        setAnnotate={setAnnotate}
                        enable_hover={enable_hover}
                        setEnableHover={setEnableHover}
                      />
                    );
                  })
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Container>
  );
};

interface ModalDictIndexProps {
  word: string;
  lemma: string;
  references: References;
  open: boolean;
  onClose: () => void;
}

const ModalDictIndex: React.FC<ModalDictIndexProps> = ({
  word,
  lemma,
  references,
  open,
  onClose,
}) => {
  const [indexes, setIndexes] = useState<string[]>([]);
  const [target, setTarget] = useState<{
    mod_key: string | null;
    book: string | null;
  }>({
    mod_key: null,
    book: null,
  });
  const [annotate, setAnnotate] = useState<AnnotateType>({
    content: '',
    attributes: [],
    lang: '',
  });
  const [page, setPage] = useState<number>(1);
  const counts = countByModKey(references);
  const count_per_page = 10;
  const page_count = Math.ceil(indexes.length / count_per_page);
  const start_index = count_per_page * (page - 1);
  const target_indexes = indexes.slice(
    start_index,
    start_index + count_per_page
  );
  const classes = useStyles();
  const references_options = Object.keys(references)
    .map((modKey: string) =>
      Object.keys(references[modKey]).map((book) => ({
        mod_key: modKey,
        book,
      }))
    )
    .flat(1)
    .filter((di) => di.mod_key !== 'lemma');

  const bookDictIndex = (modKey: string, book: string) => {
    let indexes = [];
    const book_indexes = ((references || {})[modKey] || {})[book];
    for (let chapter in book_indexes) {
      for (let verse in book_indexes[chapter]) {
        indexes.push(`${book}.${chapter}:${verse}`);
      }
    }
    return indexes;
  };

  useEffect(() => {
    const references2 = references || {};
    const modKey = Object.keys(references2)[0];
    const book = Object.keys(references2[modKey] || {})[0];
    setTarget({ mod_key: modKey, book: book });
    setIndexes(bookDictIndex(modKey, book));
    setPage(1);
  }, [references]);

  const onChangeTarget = (
    e: React.ChangeEvent<{ name?: string; value: unknown }>
  ) => {
    if (e.target && e.target.value && typeof e.target.value == 'string') {
      const [modKey, book] = e.target.value.split(':');
      setTarget({ mod_key: modKey, book: book });
      setIndexes(bookDictIndex(modKey, book));
      setPage(1);
    }
  };

  const onChangePage = (e: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      classes={{ paper: classes.dialog }}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
    >
      <Typography
        variant="h5"
        component="h6"
        style={{ margin: 10, marginLeft: 20 }}
      >
        {word}
        <small>{'(' + str(lemma) + ')'}</small>
        <FormControl>
          <Select
            labelId="demo-simple-select-helper-label"
            id="age-native-simple"
            value={`${target.mod_key}:${target.book}`}
            style={{ width: 200, marginLeft: 50 }}
            onChange={onChangeTarget}
          >
            {references_options.map((option) => (
              <MenuItem value={`${option.mod_key}:${option.book}`}>
                {`[${option.mod_key}] ${option.book} (x${
                  counts[option.mod_key][option.book]
                })`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Typography>
      <Divider />
      <div className={classes.container}>
        <Box className={classes.pane}>
          {page_count > 1 && (
            <Grid container justify="center">
              <Pagination
                count={page_count}
                page={page}
                onChange={onChangePage}
              />
            </Grid>
          )}
          {target.mod_key && (
            <RefPassages
              indexes={target_indexes}
              mod_key={target.mod_key}
              lemma={lemma}
              setAnnotate={setAnnotate}
            />
          )}

          {page_count > 1 && (
            <Grid container justify="center">
              <Pagination
                count={page_count}
                page={page}
                onChange={onChangePage}
              />
            </Grid>
          )}
        </Box>
        <Box className={classes.pane}>
          <Annotate annotate={annotate} />
        </Box>
      </div>
    </Dialog>
  );
};

interface BibleReferenceProps {
  word: string;
  lemma: string;
  references: References;
}

const BibleReference: React.FC<BibleReferenceProps> = ({
  word,
  lemma,
  references,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const counts = countByModKey(references);
  const label = Object.keys(counts)
    .map(
      (modname) =>
        `${modname}(${Object.values(counts[modname]).reduce(
          (i, j) => i + j,
          0
        )})`
    )
    .join(' ');

  return (
    <>
      <Chip
        label={label}
        variant="outlined"
        size="small"
        onClick={() => setOpen(true)}
      />
      {open && (
        <ModalDictIndex
          word={word}
          lemma={lemma}
          references={references}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default BibleReference;
