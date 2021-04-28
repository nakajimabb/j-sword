import React, { useState, useEffect, useContext } from 'react';
import clsx from 'clsx';

import { Button, Form, Grid, Icon, Modal, Tabs } from './components';
import { canons } from './sword/Canon';
import canon_jp from './sword/canons/locale/ja.json';
import AppContext from './AppContext';

import './App.css';

type DialogProps = {
  open: boolean;
  onClose: () => void;
};

const Dialog: React.FC<DialogProps> = ({ open, onClose }) => {
  const { target, setTarget, layouts, saveSetting } = useContext(AppContext);
  const canon = canons.nrsv;
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;
  const [tab, setTab] = useState('0');
  const [modname, setModname] = useState('');
  const [chapter, setChapter] = useState(0);
  const [maxChapter, setMaxChapter] = useState<number>(canon.ot[0].maxChapter);

  useEffect(() => {
    setModname(target.book);
    setChapter(+target.chapter);
  }, [target]);

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
                    const newTarget = {
                      book: modname,
                      chapter: String(chap),
                      verse: '',
                    };
                    setChapter(chap);
                    setTarget(newTarget);
                    saveSetting(newTarget, layouts);
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
  trigger: React.ReactElement;
  className?: string;
};

const BookOpener: React.FC<Props> = ({ trigger, className }) => {
  const { target, setTarget, layouts, saveSetting } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState('');

  useEffect(() => {
    setPosition(`${target.book}.${target.chapter}`);
  }, [target]);

  return (
    <div className={clsx('relative w-32 h-8 my-2', className)}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Form.Text
        size="sm"
        placeholder="Gen.1:1"
        value={position}
        onChange={(e) => {
          setPosition(e.target.value);
        }}
        onKeyPress={(e) => {
          if (e.charCode === 13 && position) {
            const m = position.match(/(\w+)\.(\w+)/);
            if (m) {
              const newTarget = {
                book: m[1],
                chapter: m[2],
                verse: '',
              };
              setTarget(newTarget);
              saveSetting(newTarget, layouts);
            }
          }
        }}
        className="absolute top-0 left-0 w-full h-full pl-8"
      />
      <Dialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default BookOpener;
