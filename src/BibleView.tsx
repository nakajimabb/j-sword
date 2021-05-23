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
  const { bibles, targetHistory, interlocked, targetOsisRefs, setLayouts } =
    useContext(AppContext);
  const bible = bibles[modname];
  const direction = bible?.conf?.Direction === 'RtoL' && 'rtl';
  const lang = String(bible?.lang);
  const title = bible?.title;
  const mode = targetHistory.current()?.mode || 'bible';

  useEffect(() => {
    const disableLayout = (disabled: boolean) => {
      setLayouts((prev) => {
        const newLayouts = [...prev];
        if (col < newLayouts.length && row < newLayouts[col].length) {
          newLayouts[col][row].disabled = disabled;
        }
        return newLayouts;
      });
    };

    const updateRawTexts = async (osisRefs: string[]) => {
      try {
        const new_raw_texts: Raw[] = [];
        for await (const osisRef of osisRefs) {
          const texts = await bibles[modname].renderText(osisRef, {
            footnotes: false,
            crossReferences: true,
            oneVersePerLine: true,
            headings: true,
            wordsOfChristInRed: true,
            intro: true,
            array: false,
          });
          if (texts) {
            new_raw_texts.push(...texts);
          }
        }
        setRawTexts(new_raw_texts);
      } catch (error) {
        console.log({ error });
        setRawTexts([]);
        disableLayout(true);
      }
    };

    const f = async () => {
      const current = targetHistory.current();
      if (current) {
        if (current.mode === 'bible') {
          updateRawTexts([current.search]);
        } else if (current.mode === 'word') {
          updateRawTexts(targetOsisRefs);
        }
        disableLayout(false);
      } else {
        setRawTexts([]);
        disableLayout(true);
      }
    };
    f();
  }, [modname, col, row, bibles, targetHistory, targetOsisRefs, setLayouts]);

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
    if (!interlocked) return;

    const now = new Date();
    const target = e.currentTarget;
    if (!g_scroll.id || !g_scroll.time || +now - +g_scroll.time > 100) {
      g_scroll = { id: target.id, time: new Date() };
    }
    if (g_scroll.id && target.id && g_scroll.id === target.id) {
      const scroll_pos =
        target.scrollTop / (target.scrollHeight - target.clientHeight);
      const contents = document.querySelectorAll('.bible-view');
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
    <FrameView col={col} row={row}>
      <FrameView.Nav title={title} col={col} row={row} />
      <FrameView.Body
        id={`${modname}`}
        col={col}
        row={row}
        onScroll={onScroll}
        className="bible-view"
      >
        {raw_texts.length > 0 && (
          <div className="p-2">
            <div className={clsx(direction, lang)}>
              {raw_texts.map((raw, index: number) => (
                <div
                  key={index}
                  className="passage"
                  data-pos={raw.osisRef}
                  onMouseOver={onMouseOver}
                  onMouseLeave={onMouseLeave}
                >
                  <Passage
                    lang={lang}
                    raw={raw}
                    showPosition={mode !== 'bible' ? 'chapter verse' : 'verse'}
                  />
                  {mode !== 'bible' && <br />}
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
