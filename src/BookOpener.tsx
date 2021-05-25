import React, { useState, useEffect, useContext } from 'react';
import clsx from 'clsx';

import {
  Button,
  Flex,
  Form,
  Grid,
  Icon,
  Modal,
  Progress,
  Tabs,
} from './components';
import { canons } from './sword/Canon';
import canon_jp from './sword/canons/locale/ja.json';
import { parseBibleTarget } from './sword/parseTarget';
import { OsisLocation } from './sword/types';
import DictPassage from './DictPassage';
import AppContext from './AppContext';

import './App.css';

type FoldingProps = {
  height: number;
  nav: React.ReactElement;
  className?: string;
};

const Folding: React.FC<FoldingProps> = ({
  height,
  nav,
  className,
  children,
}) => {
  const [fold, setFold] = useState(true);

  return (
    <div
      className={clsx(
        'relative border rounded bg-white shadow',
        fold && `overflow-hidden h-${height}`,
        className
      )}
    >
      <nav className={clsx('w-full h-6 px-2 absolute top-0 bg-yellow-50')}>
        <Flex justify_content="between">
          {nav}
          <span onClick={() => setFold(!fold)}>
            <Icon
              name={fold ? 'chevron-down' : 'chevron-up'}
              className="w-4 h-4 m-1 text-gray-500 cursor-pointer hover:text-gray-300 hover:bg-gray-200 rounded-full"
            />
          </span>
        </Flex>
      </nav>
      <div className="pt-6">{children}</div>
    </div>
  );
};

type TextSearchProps = {
  onClose: () => void;
  className?: string;
};

const TextSearch: React.FC<TextSearchProps> = ({ onClose, className }) => {
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [modnames, setModnames] = useState<string[]>([]);
  const { bibles, targetHistory, setOsisLocations, setTargetHistory } =
    useContext(AppContext);

  useEffect(() => {
    const current = targetHistory.current();
    if (current && current.mode === 'text') {
      setSearch(current.search);
    }
  }, [targetHistory]);

  const searchBibles = async () => {
    const str = search.trim();
    if (str && modnames.length > 0) {
      setProgress(0);
      setShowProgress(true);
      const tasks = modnames.map(async (modname) => {
        const dict = bibles[modname];
        const raws = await dict.search(str, (inc: number) =>
          setProgress((prev) => prev + inc / modnames.length)
        );
        return { modname, raws };
      });
      const results = await Promise.all(tasks);
      console.log({ results });

      const locations: { [modname: string]: OsisLocation } = {};
      results.forEach(({ modname, raws }) => {
        if (!locations[modname]) locations[modname] = {};
        raws.forEach(({ key }) => {
          const m = key.match(/^(\w+)\.(\d+):(\d+)$/);
          if (m && m[1] && m[2] && m[3]) {
            if (!locations[modname][m[1]]) locations[modname][m[1]] = {};
            if (!locations[modname][m[1]][+m[2]])
              locations[modname][m[1]][+m[2]] = {};
            if (!locations[modname][m[1]][+m[2]][+m[3]])
              locations[modname][m[1]][+m[2]][+m[3]] = 0;
            if (!locations[modname][m[1]][+m[2]][+m[3]])
              locations[modname][m[1]][+m[2]][+m[3]] += 1;
          }
        });
      });
      setOsisLocations(locations);
      const mode = targetHistory.addHistory(str);
      setTargetHistory(targetHistory.dup());
      setShowProgress(false);
      onClose();
    }
  };

  const switchModname = (modname: string) => () => {
    if (modnames.includes(modname)) {
      setModnames(modnames.filter((name) => name !== modname));
    } else {
      setModnames([...modnames, modname]);
    }
  };

  return (
    <div className={className}>
      <Flex className="my-2">
        <Form.Text
          value={search}
          placeholder="例) H2091,H3701"
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 mr-1"
        />
        <Button
          color="primary"
          disabled={showProgress}
          onClick={searchBibles}
          className="mx-1"
        >
          聖書検索
        </Button>
      </Flex>
      {Object.keys(bibles).map((modname, index) => (
        <div key={index}>
          <Form.Checkbox
            checked={modnames.includes(modname)}
            size="md"
            label={bibles[modname].title}
            onChange={switchModname(modname)}
            className="my-2"
          />
        </div>
      ))}
      {showProgress && (
        <Progress label={`${Math.round(progress)}%`} value={progress} />
      )}
    </div>
  );
};

type WordResult = {
  modname: string;
  raws: {
    key: string;
    raw: string;
  }[];
};

type WordSearchProps = {
  onClose: () => void;
  className?: string;
};

const WordSearch: React.FC<WordSearchProps> = ({ onClose, className }) => {
  const [word, setWord] = useState('');
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [modnames, setModnames] = useState<string[]>([]);
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const { dictionaries, targetHistory, updateTargetHistory } =
    useContext(AppContext);
  const [tab, setTab] = useState('');

  useEffect(() => {
    const current = targetHistory.current();
    if (current && current.mode === 'word') {
      setSearch(current.search);
    }
  }, [targetHistory]);

  const searchDict = async () => {
    const str = word.trim();
    if (str && modnames.length > 0) {
      setProgress(0);
      setShowProgress(true);
      const tasks = modnames.map(async (modname) => {
        const dict = dictionaries[modname];
        const raws = await dict.search(str, (inc: number) =>
          setProgress((prev) => prev + inc / modnames.length)
        );
        return { modname, raws };
      });
      const results = await Promise.all(tasks);
      setTab(modnames[0]);
      setWordResults(results);
      setShowProgress(false);
    }
  };

  const switchModname = (modname: string) => () => {
    if (modnames.includes(modname)) {
      setModnames(modnames.filter((name) => name !== modname));
    } else {
      setModnames([...modnames, modname]);
    }
  };

  const addSearch = (lemma: string) => () => {
    const lemmas = search.split(/[,&]/);
    if (!lemmas.includes(lemma)) {
      const idx = search.search(/[,&]/);
      const sep = idx >= 0 ? search[idx] : ',';
      setSearch(search ? search + sep + lemma : lemma);
    }
  };

  const changeSearchSep = (sep: ',' | '&') => () => {
    const lemmas = search.split(/[,&]/);
    setSearch(lemmas.join(sep));
  };

  const searchBible = () => {
    const mode = targetHistory.addHistory(search);
    if (mode) {
      updateTargetHistory(targetHistory.dup(), true);
      onClose();
    }
  };

  return (
    <div className={className}>
      <Flex className="mb-2 w-96">
        <Form.Text
          value={word}
          placeholder="検索ワード"
          onChange={(e) => setWord(e.target.value)}
          className="flex-1"
        />
        <Button
          color="primary"
          disabled={showProgress}
          onClick={searchDict}
          className="mx-1"
        >
          辞書検索
        </Button>
      </Flex>
      {Object.keys(dictionaries).map((modname, index) => (
        <div key={index}>
          <Form.Checkbox
            checked={modnames.includes(modname)}
            size="md"
            label={dictionaries[modname].title}
            onChange={switchModname(modname)}
            className="my-2"
          />
        </div>
      ))}
      <Flex className="my-2">
        <Form.Text
          value={search}
          placeholder="例) H2091,H3701"
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 mr-1"
        />
        <Button
          color="primary"
          variant="outlined"
          disabled={showProgress}
          onClick={() => setSearch('')}
          className="mx-1"
        >
          クリア
        </Button>
        <Button
          color="primary"
          variant="outlined"
          disabled={showProgress}
          onClick={changeSearchSep(',')}
          className="mx-1"
        >
          OR検索
        </Button>
        <Button
          color="primary"
          variant="outlined"
          disabled={showProgress}
          onClick={changeSearchSep('&')}
          className="mr-1"
        >
          AND検索
        </Button>
        <Button
          color="primary"
          disabled={showProgress}
          onClick={searchBible}
          className="mx-1"
        >
          聖書検索
        </Button>
      </Flex>
      {showProgress && (
        <Progress label={`${Math.round(progress)}%`} value={progress} />
      )}
      {wordResults.length > 0 && (
        <div className="bg-white mt-3 rounded shadow-md border-gray-400">
          <Tabs
            value={tab}
            variant="bar"
            size="sm"
            baseLine
            onChange={(modname) => setTab(modname)}
          >
            {wordResults.map((wordResult) => (
              <Tabs.Tab
                label={dictionaries[wordResult.modname].title}
                value={wordResult.modname}
              />
            ))}
          </Tabs>
          {wordResults.map((wordResult) => (
            <div
              className={clsx(
                'px-3 pb-2',
                tab !== wordResult.modname && 'hidden'
              )}
            >
              {wordResult.raws.map((raw) => (
                <Folding
                  nav={
                    <Flex align_items="center">
                      <span onClick={addSearch(raw.key)}>
                        <Icon
                          name="plus-circle"
                          variant="solid"
                          className="w-5 h-5 text-blue-500 cursor-pointer ml-1 hover:text-gray-300"
                        />
                      </span>
                      <b className="px-2">{raw.key}</b>
                    </Flex>
                  }
                  height={40}
                  className="my-2"
                >
                  <div className="px-3 py-1">
                    <DictPassage
                      lemma={raw.key}
                      showTitle
                      showWordCount={false}
                      className="my-2 whitespace-pre-wrap"
                    />
                  </div>
                </Folding>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

type BibleOpenerProps = {
  tab: string;
  setTab: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  className: string;
};

const BibleOpener: React.FC<BibleOpenerProps> = ({
  tab,
  setTab,
  onClose,
  className,
}) => {
  const canon = canons.nrsv;
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;
  const [modname, setModname] = useState('');
  const [chapter, setChapter] = useState(0);
  const [maxChapter, setMaxChapter] = useState<number>(canon.ot[0].maxChapter);
  const { targetHistory, updateTargetHistory } = useContext(AppContext);

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
    <div className={className}>
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
                  if (targetHistory.addHistory(`${modname}.${String(chap)}`)) {
                    updateTargetHistory(targetHistory.dup(), true);
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
    </div>
  );
};

type DialogProps = {
  open: boolean;
  onClose: () => void;
};

type SearchType = 'bible' | 'word' | 'text';

const Dialog: React.FC<DialogProps> = ({ open, onClose }) => {
  const [tab, setTab] = useState('0');
  const [searchType, setSearchType] = useState<SearchType>('bible');
  const { targetHistory } = useContext(AppContext);

  useEffect(() => {
    const current = targetHistory.current();
    if (current) {
      if (current.mode === 'bible') {
        setSearchType('bible');
      } else if (current.mode === 'word') {
        setSearchType('word');
      }
    }
  }, [targetHistory]);

  return (
    <Modal open={open} onClose={onClose} size="2xl">
      <Modal.Header padding={0} onClose={onClose}>
        <Flex className="w-96">
          <div className="mx-4 my-1">
            <Form.Select
              size="sm"
              value={searchType}
              options={[
                { label: '聖書', value: 'bible' },
                { label: '辞書検索', value: 'word' },
                { label: '全文検索', value: 'text' },
              ]}
              onChange={(e) => setSearchType(e.target.value as SearchType)}
            />
          </div>
          {searchType === 'bible' && (
            <Tabs
              value={tab}
              variant="bar"
              size="sm"
              baseLine
              onChange={(v) => setTab(v)}
              className="w-40"
            >
              <Tabs.Tab label="聖書" value="0" />
              <Tabs.Tab label="章" value="1" />
            </Tabs>
          )}
        </Flex>
      </Modal.Header>
      <Modal.Body className="bg-gray-50">
        <BibleOpener
          tab={tab}
          setTab={setTab}
          onClose={onClose}
          className={clsx(searchType !== 'bible' && 'hidden')}
        />
        <WordSearch
          onClose={onClose}
          className={clsx(searchType !== 'word' && 'hidden')}
        />
        <TextSearch
          onClose={onClose}
          className={clsx(searchType !== 'text' && 'hidden')}
        />
      </Modal.Body>
    </Modal>
  );
};

type Props = {
  className?: string;
};

const BookOpener: React.FC<Props> = ({ className }) => {
  const { targetHistory, updateTargetHistory } = useContext(AppContext);
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
      updateTargetHistory(targetHistory.dup(), true);
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
        onKeyPress={async (e) => {
          if (e.charCode === 13 && position) {
            const mode = targetHistory.addHistory(position);
            if (mode) updateTargetHistory(targetHistory.dup(), true);
          }
        }}
        className="absolute top-0 left-0 w-full h-full pl-8 pr-5"
      />
      <Dialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default BookOpener;
