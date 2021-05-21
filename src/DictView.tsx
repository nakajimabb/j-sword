import React, { useState, useEffect, useContext } from 'react';
import clsx from 'clsx';

import { Button, Flex, Form, Icon } from './components';
import DictPassage from './DictPassage';
import MorphPassage from './MorphPassage';
import AppContext from './AppContext';
import FrameView from './FrameView';
import { Layout } from './types';
import { shapeLemma } from './NodeObj';

type Props = {
  col: number;
  row: number;
  layout: Layout;
  onClose?: () => void;
};

const DictView: React.FC<Props> = ({ layout, col, row }) => {
  const [shapedLemma, setShapedLemma] = useState<string>('');
  const {
    targetWord,
    setTargetWord,
    layouts,
    targetHistory,
    setTargetHistory,
    saveSetting,
  } = useContext(AppContext);
  const { text: wordText, lemma, morph, fixed } = targetWord;
  const lang = lemma[0] === 'H' ? 'he' : 'grc';

  useEffect(() => {
    const m = lemma.match(/(\d+)/);
    if (m && m[1]) {
      const lang = lemma[0] === 'H' ? 'he' : 'grc';
      const newLemma = shapeLemma(m[1], lang);
      setShapedLemma(newLemma);
    }
  }, [lemma]);

  const reverseFixed = () => {
    setTargetWord({ ...targetWord, fixed: !targetWord.fixed });
  };

  const changeLemma = (newLemma: string) => {
    setTargetWord({ ...targetWord, lemma: newLemma, text: '', morph: '' });
  };

  const incrementLemma = (inc: number) => () => {
    const m = lemma.match(/(\d+)/);
    if (m && m[1]) {
      const number = +m[1] + inc;
      if (number > 0) {
        const newLemma = shapeLemma(String(number), lang);
        changeLemma(newLemma);
      }
    }
  };

  const onChangeLemma = (e: React.ChangeEvent<{ value: unknown }>) => {
    changeLemma(String(e.currentTarget.value));
  };

  const setTarget = () => {
    const mode = targetHistory.addHistory(lemma);
    setTargetHistory(targetHistory.dup());
    saveSetting(targetHistory.history, layouts);
    if (mode === 'word') {
      setTargetWord({
        lemma,
        morph: '',
        text: '',
        fixed: true,
      });
    }
  };

  return (
    <FrameView col={col} row={row}>
      <FrameView.Nav title="辞書" col={col} row={row} />
      <FrameView.Body col={col} row={row}>
        <div className="p-2">
          {lemma && (
            <Flex align_items="center" className="mb-2">
              <Button
                variant="icon"
                size="none"
                color="none"
                onClick={incrementLemma(-1)}
                className="mr-1 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300 w-6 h-6"
              >
                <Icon name="chevron-left" variant="outline" />
              </Button>
              <Form.Text
                value={lemma}
                size="sm"
                onChange={onChangeLemma}
                className="h-7 w-48"
              />
              <Button
                variant="icon"
                size="none"
                color="none"
                onClick={incrementLemma(1)}
                className="mx-1 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300 w-6 h-6"
              >
                <Icon name="chevron-right" variant="outline" />
              </Button>
              <Button
                variant="icon"
                size="none"
                color="none"
                onClick={setTarget}
                className="p-1 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300 w-8 h-8"
              >
                <Icon name="document-search" />
              </Button>
              <Button
                variant="icon"
                size="none"
                color="none"
                onClick={reverseFixed}
                className="p-1 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300 w-8 h-8"
              >
                <Icon
                  name="location-marker"
                  variant={fixed ? 'solid' : 'outline'}
                  className={clsx(fixed && 'text-red-600')}
                />
              </Button>
            </Flex>
          )}

          {wordText && lemma && (
            <div className="bg-gray-50 rounded-md p-1 shadow mb-2">
              <span className={clsx(lang, 'text-2xl')}>{wordText}</span>
              <MorphPassage morph={morph} className="mb-1" />
            </div>
          )}

          <DictPassage
            lemma={shapedLemma}
            showTitle
            showWordCount
            className="whitespace-pre-wrap bg-gray-50 rounded-md shadow p-1 mb-2"
          />
        </div>
      </FrameView.Body>
    </FrameView>
  );
};

export default DictView;
