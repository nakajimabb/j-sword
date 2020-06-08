import React, { useEffect, useState, useContext } from 'react';
import { Box } from '@material-ui/core';
import clsx from 'clsx';
import AppContext from './AppContext';
import Passage from './Passage';
import { Raw } from './sword/types';
import './passage.css';

interface Props {
  mod_key: string;
}

const SwordRenderer: React.FC<Props> = ({ mod_key }) => {
  const [raw_texts, setRawTexts] = useState<Raw[]>([]);
  const [enable_hover, setEnableHover] = useState<boolean>(true);
  const { bibles, target, setAnnotate } = useContext(AppContext);
  const { book, chapter, verse } = target;
  const bible = bibles[mod_key];
  const direction = bible?.conf?.Direction === 'RtoL' && 'rtl';
  const lang = String(bible?.conf?.Lang);
  const valid_params = bible && book && chapter;

  useEffect(() => {
    const f = async () => {
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

  if (raw_texts.length === 0) return null;

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
