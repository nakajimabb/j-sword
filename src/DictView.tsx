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
  col?: number;
  row?: number;
  layout?: Layout;
  onClose?: () => void;
};

const DictView: React.FC<Props> = ({ layout, col, row }) => {
  const [shapedLemma, setShapedLemma] = useState<string>('');
  const [wordCounts, setWordCounts] = useState<{ [modname: string]: number }>(
    {}
  );
  const {
    bibles,
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

  useEffect(() => {
    const f = async () => {
      const modnames = layouts
        .flat()
        .filter((layout) => layout.type === 'bible')
        .map((layout) => layout.modname);
      const tasks = modnames.map(async (modname) => {
        const count = await bibles[modname].countWord(lemma);
        return { modname, count };
      });
      const results = await Promise.all(tasks);
      const counts: { [modname: string]: number } = {};
      results.forEach((result) => {
        if (result.count) counts[result.modname] = result.count;
      });
      setWordCounts(counts);
    };
    f();
  }, [lemma, bibles, layouts, targetHistory]); // layouts circular dependency?

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

  const contents = (
    <div className="p-2">
      {lemma && (
        <Flex justify_content="between" align_items="center">
          <Flex>
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
            <p>
              {Object.keys(wordCounts).map((modname, index) => (
                <small
                  key={index}
                  className="pl-1"
                >{`${modname}(${wordCounts[modname]})`}</small>
              ))}
            </p>
          </Flex>
          <Flex>
            <Button
              variant="icon"
              size="none"
              color="none"
              onClick={setTarget}
              className="ml-1 p-1 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300 w-8 h-8"
            >
              <Icon name="document-search" />
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
        </Flex>
      )}

      {wordText && lemma && (
        <span className={clsx(lang, 'text-2xl')}>{wordText}</span>
      )}

      <MorphPassage morph={morph} className="mb-1" />

      <DictPassage lemma={shapedLemma} className="mb-1 whitespace-pre-wrap" />
    </div>
  );

  return col !== undefined && row !== undefined && layout !== undefined ? (
    <FrameView col={col} row={row}>
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
