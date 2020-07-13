import React, { useEffect, useState, useContext } from 'react';
import { Box, Chip, makeStyles } from '@material-ui/core';
import clsx from 'clsx';

import firebase from './firebase';
import 'firebase/firestore';
import 'firebase/storage';
import AppContext from './AppContext';
import Passage from './Passage';
import { Raw } from './sword/types';
import Sword from './sword/Sword';
import './passage.css';

let g_scroll: { id: string | null; time: Date | null } = {
  id: null,
  time: null,
};

const useStyles = makeStyles((theme) => ({
  pane: {
    overflow: 'scroll',
    padding: theme.spacing(1),
    textAlign: 'left',
    width: '100%',
    height: 'calc(100vh - 90px)',
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

const blobFromUrl = (url: string) => {
  return new Promise<Blob | null>((resolve, reject) => {
    if (!url) reject(null);
    const storage = firebase.storage();
    var httpsReference = storage.refFromURL(url);
    httpsReference.getDownloadURL().then(function (url2) {
      let xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = async () => {
        resolve(xhr.response);
      };
      xhr.open('GET', url2);
      xhr.send();
    });
  });
};

interface Props {
  mod_key: string;
}

const SwordRenderer: React.FC<Props> = ({ mod_key }) => {
  const [raw_texts, setRawTexts] = useState<Raw[]>([]);
  const [enable_hover, setEnableHover] = useState<boolean>(true);
  const [enabled, setEnabled] = useState<boolean>(false);
  const {
    bibles,
    setSwordModule,
    target,
    setAnnotate,
    sample_modules,
  } = useContext(AppContext);
  const { book, chapter, verse } = target;
  const bible = bibles[mod_key];
  const direction = bible?.conf?.Direction === 'RtoL' && 'rtl';
  const lang = String(bible?.conf?.Lang);
  const valid_params = bible && book && chapter;
  const classes = useStyles();

  useEffect(() => {
    const f = async () => {
      if (bible.isValid()) {
        setEnabled(true);
      } else {
        if (bible.modname in sample_modules) {
          const snapshot = await firebase
            .firestore()
            .collection('modules')
            .doc(bible.modname)
            .get();
          const bible_module = snapshot?.data();
          console.log(`installing ${bible.modname} module...`);
          if (bible_module) {
            const blob = await blobFromUrl(bible_module.url);
            if (blob)
              await Sword.install(
                blob,
                bible_module.modtype,
                bible_module.title
              );
            const sword = await Sword.load(bible.modname);
            if (sword) setSwordModule(sword);
            // install reference for hebrew or greek vocabulary
            if (bible_module.referenceUrl) {
              const blob = await blobFromUrl(bible_module.referenceUrl);
              if (blob && sword) await sword.installReference(blob);
            }
            // install dependencies
            const dependencies = bible_module.dependencies || [];
            for (const modname of dependencies) {
              let sword_module = await Sword.load(modname);
              if (sword_module?.isValid()) continue;
              const snap = await firebase
                .firestore()
                .collection('modules')
                .doc(modname)
                .get();
              const module = snap?.data();
              console.log(`installing ${modname} module...`);
              if (module) {
                const blob = await blobFromUrl(module.url);
                if (blob)
                  await Sword.install(blob, module.modtype, module.title);
                sword_module = await Sword.load(modname);
                if (sword_module) setSwordModule(sword_module);
              }
            }
            setEnabled(true);
          }
        }
      }

      if (valid_params) {
        let book_pos = book + '.' + chapter;
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
  }, [bible, chapter, verse]);

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

  if (!enabled || raw_texts.length === 0) return null;

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
                <Passage
                  lang={lang}
                  raw={raw}
                  setAnnotate={setAnnotate}
                  enable_hover={enable_hover}
                  setEnableHover={setEnableHover}
                  show_verse={true}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </>
  );
};

export default SwordRenderer;
