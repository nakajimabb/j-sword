import React, { useEffect, useState, useContext } from 'react';
import clsx from 'clsx';

import { Raw } from './sword/types';
import AppContext from './AppContext';
import Passage from './Passage';
import FrameView from './FrameView';
import './passage.css';

let g_scroll: { id: string | null; time: Date | null } = {
  id: null,
  time: null,
};

type Props = {
  modname: string;
  col: number;
  row: number;
};

const BibleView: React.FC<Props> = ({ modname, col, row }) => {
  const [raw_texts, setRawTexts] = useState<Raw[]>([]);
  const { bibles, target } = useContext(AppContext);
  const { book, chapter, verse } = target;
  const bible = bibles[modname];
  const direction = bible?.conf?.Direction === 'RtoL' && 'rtl';
  const lang = String(bible?.lang);
  const valid_params = bible && book && chapter;
  const title = bible?.title;

  useEffect(() => {
    const f = async () => {
      if (valid_params) {
        let book_pos = book + '.' + chapter; // + ':1-3';
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

  return (
    <FrameView>
      <FrameView.Nav title={title} col={col} row={row} />
      <FrameView.Body col={col} row={row}>
        {valid_params && (
          <div id={`pane-${modname}`} className="pane p-2" onScroll={onScroll}>
            <div className={clsx(direction, lang)}>
              {raw_texts.map((raw, index: number) => (
                <div
                  key={index}
                  className="passage"
                  data-pos={`${book}-${chapter}-${raw.verse}`}
                  onMouseOver={onMouseOver}
                  onMouseLeave={onMouseLeave}
                >
                  <Passage depth={0} lang={lang} raw={raw} show_verse={true} />
                </div>
              ))}
            </div>
          </div>
        )}
      </FrameView.Body>
    </FrameView>
  );
};

export default BibleView;
