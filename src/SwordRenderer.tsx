import React, { useEffect, useState, useContext } from 'react';
import { Box } from '@material-ui/core';
import clsx from 'clsx';

import firebase from './firebase';
import 'firebase/storage';
import AppContext from './AppContext';
import Passage from './Passage';
import { Raw, ModType } from './sword/types';
import Sword from './sword/Sword';
import './passage.css';

interface Props {
  mod_key: string;
}

const SwordRenderer: React.FC<Props> = ({ mod_key }) => {
  const [raw_texts, setRawTexts] = useState<Raw[]>([]);
  const [enable_hover, setEnableHover] = useState<boolean>(true);
  const [enabled, setEnabled] = useState<boolean>(false);
  const { bibles, target, setAnnotate, module_urls } = useContext(AppContext);
  const { book, chapter, verse } = target;
  const bible = bibles[mod_key];
  const direction = bible?.conf?.Direction === 'RtoL' && 'rtl';
  const lang = String(bible?.conf?.Lang);
  const valid_params = bible && book && chapter;

  useEffect(() => {
    const f = async () => {
      if (bible.isValid()) {
        setEnabled(true);
      } else {
        const url = module_urls[bible.modname]?.bible;
        await installFromUrl(url, 'bible');
        const sword = await Sword.load(bible.modname);
        if (sword) bibles[bible.modname] = sword;
        console.log(`module installed from ${url}`);
        setEnabled(true);
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
        } catch (e) {
          setRawTexts([]);
        }
      } else {
        return null;
      }
    };
    f();
  }, [bible, chapter, verse]);

  const installFromUrl = (url: string, modtype: ModType) => {
    return new Promise<boolean>((resolve, reject) => {
      if (!url) reject(false);
      const storage = firebase.storage();
      var httpsReference = storage.refFromURL(url);
      httpsReference.getDownloadURL().then(function (url2) {
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = async () => {
          const blob = xhr.response;
          await Sword.install(blob, modtype);
          resolve(true);
        };
        xhr.open('GET', url2);
        xhr.send();
      });
    });
  };

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

  if (!enabled || raw_texts.length === 0) return null;

  return (
    <>
      {valid_params && (
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
                raw={raw}
                setAnnotate={setAnnotate}
                enable_hover={enable_hover}
                setEnableHover={setEnableHover}
                show_verse={true}
              />
            </Box>
          ))}
        </Box>
      )}
    </>
  );
};

export default SwordRenderer;
