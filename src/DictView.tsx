import React, { useState, useEffect, useContext } from 'react';
import clsx from 'clsx';

import { Button, Flex, Form, Icon } from './components';
import BibleReference from './BibleReference';
import DictPassage from './DictPassage';
import MorphPassage from './MorphPassage';
import AppContext from './AppContext';
import FrameView from './FrameView';
import { Layout } from './types';
import { shapeLemma } from './NodeObj';

type Props = {
  depth: number;
  col?: number;
  row?: number;
  layout?: Layout;
  onClose?: () => void;
};

const DictView: React.FC<Props> = ({ depth, layout, col, row }) => {
  const [shapedLemma, setShapedLemma] = useState<string>('');
  const {
    targetWords,
    setTargetWords,
    layouts,
    targetHistory,
    setTargetHistory,
    saveSetting,
  } = useContext(AppContext);
  const word = targetWords[depth];
  const { text: wordText, lang, lemma, morph, fixed } = word;

  useEffect(() => {
    // 次の要素が存在しなければ前もって追加しておく
    if (targetWords.length <= depth + 1) {
      setTargetWords([...targetWords, targetWords[targetWords.length - 1]]);
    }
  }, []);

  useEffect(() => {
    const m = lemma.match(/(\d+)/);
    if (m && m[1]) {
      const newLemma = shapeLemma(m[1], lang);
      setShapedLemma(newLemma);
    }
  }, [lemma]);

  const reverseFixed = () => {
    let words = [...targetWords];
    words[depth] = { ...word, fixed: !word.fixed };
    setTargetWords(words);
  };

  const changeLemma = (newLemma: string) => {
    let words = [...targetWords];
    const new_word = { ...word, lemma: newLemma, text: '', morph: '' };
    const next_word = { ...new_word, targetLemma: newLemma };
    words[depth] = new_word;
    if (words.length > depth) {
      words[depth + 1] = next_word;
    } else {
      words.push(next_word);
    }
    setTargetWords(words);
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
      const lang = lemma === 'H' ? 'he' : 'grc';
      const word = {
        lemma,
        morph: '',
        text: '',
        lang,
        targetLemma: lemma,
        fixed: true,
      };
      setTargetWords([word]);
    }
  };

  const contents = (
    <div className="p-2">
      {lemma && (
        <Flex align_items="center">
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
            className="h-7 w-20"
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
          <BibleReference lemma={shapedLemma} depth={depth + 1} />
          <Button
            variant="icon"
            size="none"
            color="none"
            onClick={setTarget}
            className="ml-1 p-1 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300 w-8 h-8"
          >
            <Icon name="search" />
          </Button>
          <Button
            variant="icon"
            size="none"
            color="none"
            onClick={reverseFixed}
            className="ml-1 p-1 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300 w-8 h-8"
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
        <span className={clsx(lang, 'tex-2xl')}>{wordText}</span>
      )}

      <MorphPassage morph={morph} className="mb-1" />

      <DictPassage
        lemma={shapedLemma}
        lang={lang}
        className="mb-1 whitespace-pre-wrap"
      />
    </div>
  );

  return col !== undefined && row !== undefined && layout !== undefined ? (
    <FrameView>
      <FrameView.Nav title="辞書" col={col} row={row} />
      <FrameView.Body col={col} row={row}>
        {contents}
      </FrameView.Body>
    </FrameView>
  ) : (
    contents
  );
};

export default DictView;
