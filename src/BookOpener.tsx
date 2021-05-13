import React, { useState, useEffect, useContext } from 'react';
import clsx from 'clsx';

import { Button, Form, Grid, Icon, Modal, Tabs } from './components';
import { canons } from './sword/Canon';
import canon_jp from './sword/canons/locale/ja.json';
import { parseBibleTarget } from './sword/parseTarget';
import AppContext, { Word } from './AppContext';

import './App.css';
import TargetHistory from './TargetHistory';

type DialogProps = {
  open: boolean;
  onClose: () => void;
};

const Dialog: React.FC<DialogProps> = ({ open, onClose }) => {
  const { targetHistory, setTargetHistory, layouts, saveSetting } =
    useContext(AppContext);
  const canon = canons.nrsv;
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;
  const [tab, setTab] = useState('0');
  const [modname, setModname] = useState('');
  const [chapter, setChapter] = useState(0);
  const [maxChapter, setMaxChapter] = useState<number>(canon.ot[0].maxChapter);

  useEffect(() => {
    const current = targetHistory.current();
    if (current && current.mode === 'bible') {
      const result = parseBibleTarget(current.search);
      if (result) {
        setModname(result.book);
        setChapter(+result.chapter);
      }
    }
  }, [targetHistory]);

  return (
    <Modal open={open} onClose={onClose} size="7xl">
      <Modal.Header padding={0} onClose={onClose}>
        <Tabs
          value={tab}
          variant="bar"
          size="sm"
          baseLine
          onChange={(v) => setTab(v)}
        >
          <Tabs.Tab label="聖書" value="0" />
          <Tabs.Tab label="章" value="1" />
        </Tabs>
      </Modal.Header>
      <Modal.Body className="bg-gray-50 w-96">
        {tab === '0' && (
          <Grid cols="6" gap="0">
            {canon.ot.map((info, index) => (
              <div
                key={index}
                onClick={() => {
                  setModname(info.abbrev);
                  setMaxChapter(info.maxChapter);
                  setTab('1');
                }}
                className={clsx(
                  'border border-gray-400 text-center h-12 hover:opacity-40 select-none',
                  info.abbrev !== modname && 'bg-blue-100',
                  info.abbrev === modname && 'bg-blue-300'
                )}
              >
                <div>{canonjp[info.abbrev].abbrev}</div>
                <small>{info.abbrev}</small>
              </div>
            ))}
            {canon.nt.map((info, index) => (
              <div
                key={index}
                onClick={() => {
                  setModname(info.abbrev);
                  setMaxChapter(info.maxChapter);
                  setTab('1');
                }}
                className={clsx(
                  'border border-gray-400 text-center h-12 hover:opacity-40 select-none',
                  info.abbrev !== modname && 'bg-green-100',
                  info.abbrev === modname && 'bg-green-300'
                )}
              >
                <div>{canonjp[info.abbrev].abbrev}</div>
                <small>{info.abbrev}</small>
              </div>
            ))}
          </Grid>
        )}
        {tab === '1' && (
          <Grid cols={10} gap="0">
            {[...Array(maxChapter)]
              .map((_, i) => i + 1)
              .map((chap, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setChapter(chap);
                    if (
                      targetHistory.addHistory(`${modname}.${String(chap)}`)
                    ) {
                      setTargetHistory(targetHistory.dup());
                      saveSetting(targetHistory.history, layouts);
                    }
                    onClose();
                  }}
                  className={clsx(
                    'border border-gray-400 text-center text-md hover:opacity-40 select-none py-1',
                    `bg-yellow-${chap === chapter ? 300 : 100}`
                  )}
                >
                  {chap}
                </div>
              ))}
          </Grid>
        )}
      </Modal.Body>
    </Modal>
  );
};

type Props = {
  className?: string;
};

const BookOpener: React.FC<Props> = ({ className }) => {
  const {
    targetHistory,
    setTargetHistory,
    layouts,
    saveSetting,
    setTargetWords,
  } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState('');

  useEffect(() => {
    const current = targetHistory.current();
    if (current) {
      setPosition(current.search);
    }
  }, [targetHistory]);

  const increment = (increment: number) => () => {
    if (targetHistory.incrementCurent(increment)) {
      changeTargetHistory(targetHistory.dup());
    }
  };

  const iconName = () => {
    const current = targetHistory.current();
    if (current) {
      if (current.mode === 'bible') return 'book-open';
      else if (current.mode === 'word') return 'document-search';
    }
    return 'book-open';
  };

  const changeTargetHistory = (history: TargetHistory) => {
    setTargetHistory(history);
    saveSetting(history.history, layouts);
    const current = history.current();
    if (current) {
      if (history.current()?.mode === 'word') {
        const lang = current.search[0] === 'H' ? 'he' : 'grc';
        const word: Word = {
          lemma: current.search,
          morph: '',
          text: '',
          lang,
          targetLemma: current.search,
          fixed: true,
        };
        setTargetWords([word]);
      }
    }
  };

  return (
    <div className={clsx('relative w-48 h-8 my-2', className)}>
      <Button
        variant="icon"
        size="none"
        color="none"
        onClick={() => setOpen(true)}
        className="absolute top-0 left-0 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300 z-10 w-6 h-6 p-0.5 m-1"
      >
        <Icon name={iconName()} />
      </Button>
      <Button
        variant="text"
        size="none"
        color="none"
        onClick={increment(1)}
        className="absolute top-0 left-full text-gray-500 hover:bg-gray-300 focus:ring-inset focus:ring-gray-300 z-10 w-4 h-4 -mx-4"
      >
        <Icon name="chevron-up" />
      </Button>
      <Button
        variant="text"
        size="none"
        color="none"
        onClick={increment(-1)}
        className="absolute bottom-0 left-full text-gray-500 hover:bg-gray-300 focus:ring-inset focus:ring-gray-300 z-10 w-4 h-4 -mx-4"
      >
        <Icon name="chevron-down" />
      </Button>
      <Form.Text
        size="sm"
        placeholder="Gen.1:1"
        value={position}
        onChange={(e) => {
          setPosition(e.target.value);
        }}
        onKeyPress={(e) => {
          if (e.charCode === 13 && position) {
            const mode = targetHistory.addHistory(position);
            if (mode) {
              changeTargetHistory(targetHistory.dup());
            }
          }
        }}
        className="absolute top-0 left-0 w-full h-full pl-8 pr-5"
      />
      <Dialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default BookOpener;
