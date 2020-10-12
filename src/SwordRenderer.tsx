import React, { useEffect, useState, useContext } from 'react';
import { Box, Chip, makeStyles } from '@material-ui/core';
import clsx from 'clsx';

import AppContext from './AppContext';
import Passage from './Passage';
import { Raw } from './sword/types';
import './passage.css';

let g_scroll: { id: string | null; time: Date | null } = {
  id: null,
  time: null,
};

const useStyles = makeStyles((theme) => ({
  pane: {
    overflow: 'scroll',
    padding: theme.spacing(1),
    paddingBottom: 30,
    textAlign: 'left',
    width: '100%',
    height: 'calc(100vh - 125px)',
    dislay: 'flex',
    flexDirection: 'column',
  },
  title: {
    backgroundColor: 'lightyellow',
  },
  hide: {
    display: 'none',
  },
}));

interface Props {
  mod_key: string;
}

const SwordRenderer: React.FC<Props> = ({ mod_key }) => {
  const [raw_texts, setRawTexts] = useState<Raw[]>([]);
  const { bibles, target } = useContext(AppContext);
  const { book, chapter, verse } = target;
  const bible = bibles[mod_key];
  const direction = bible?.conf?.Direction === 'RtoL' && 'rtl';
  const lang = String(bible?.conf?.Lang);
  const valid_params = bible && book && chapter;
  const classes = useStyles();

  useEffect(() => {
    const f = async () => {
      if (valid_params) {
        let book_pos = book + '.' + chapter; // + ':1';
        if (verse) book_pos += ':' + verse;
        try {
          const new_raw_texts = await bible.renderText(book_pos, {
            footnotes: false,
            crossReferences: true,
            oneVersePerLine: true,
            headings: true,
            wordsOfChristInRed: true,
            intro: true,
            array: false,
          });
          if (new_raw_texts) setRawTexts(new_raw_texts);
        } catch (error) {
          console.log({ error });
          setRawTexts([]);
        }
      } else {
        return null;
      }
    };
    f();
  }, [book, chapter, verse, bible, valid_params]);

  const hoverPassage = (
    event: React.MouseEvent,
    add_or_remove: 'add' | 'remove'
  ) => {
    let target = event.currentTarget;
    if (!target.classList.contains('passage')) {
      const closest = target.closest('.passage');
      if (closest) target = closest;
    }
    if (target.classList.contains('passage')) {
      const pos = target.getAttribute('data-pos');
      const elems = document.querySelectorAll(`[data-pos="${pos}"]`);
      elems.forEach((elem) => {
        if (add_or_remove === 'add') elem.classList.add('highlight');
        else elem.classList.remove('highlight');
      });
    }
  };

  const onMouseOver = (e: React.MouseEvent) => {
    hoverPassage(e, 'add');
  };

  const onMouseLeave = (e: React.MouseEvent) => {
    hoverPassage(e, 'remove');
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const now = new Date();
    const target = e.currentTarget;
    if (!g_scroll.id || !g_scroll.time || +now - +g_scroll.time > 100) {
      g_scroll = { id: target.id, time: new Date() };
    }
    if (g_scroll.id && target.id && g_scroll.id === target.id) {
      const scroll_pos =
        target.scrollTop / (target.scrollHeight - target.clientHeight);
      const contents = document.querySelectorAll('.pane');
      contents.forEach((content) => {
        if (content.id !== target.id) {
          content.scrollTop =
            scroll_pos * (content.scrollHeight - content.clientHeight);
        }
      });
      g_scroll = { id: target.id, time: new Date() };
    }
  };

  if (raw_texts.length === 0) return null;

  return (
    <>
      {valid_params && (
        <Box
          id={`pane-${mod_key}`}
          className={clsx('pane', classes.pane)}
          onScroll={onScroll}
        >
          <Chip
            variant="outlined"
            size="small"
            label={bible.title}
            className={classes.title}
          />
          <Box className={clsx(direction, lang)}>
            {raw_texts.map((raw, index: number) => (
              <Box
                key={index}
                className="passage"
                data-pos={`${book}-${chapter}-${raw.verse}`}
                onMouseOver={onMouseOver}
                onMouseLeave={onMouseLeave}
              >
                <Passage depth={0} lang={lang} raw={raw} show_verse={true} />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </>
  );
};

export default SwordRenderer;
