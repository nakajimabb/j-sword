import React, { useState, useEffect, useContext } from 'react';
import { Button, Flex, Form, Grid, Modal, Pagination } from './components';

import Sword from './sword/Sword';
import Passage from './Passage';
import DictView from './DictView';
import AppContext from './AppContext';
import { Raw, OsisLocation } from './sword/types';
import canon_jp from './sword/canons/locale/ja.json';
import './passage.css';
import clsx from 'clsx';

const countByModKey = (osisLocations: { [modname: string]: OsisLocation }) => {
  let sum: { [modname: string]: { [book: string]: number } } = {};
  for (let modname in osisLocations) {
    if (modname !== 'lemma') {
      sum[modname] = countByBook(modname, osisLocations);
    }
  }
  return sum;
};

const countByBook = (
  modKey: string,
  osisLocations: {
    [modname: string]: OsisLocation;
  }
) => {
  let sum: { [book: string]: number } = {};
  for (let book in osisLocations[modKey]) {
    for (let chapter in osisLocations[modKey][book]) {
      if (!sum.hasOwnProperty(book)) sum[book] = 0;
      for (let verse in osisLocations[modKey][book][chapter]) {
        sum[book] += osisLocations[modKey][book][chapter][verse];
      }
    }
  }
  return sum;
};

interface RefPassageProps {
  depth: number;
  bible: Sword;
  raw: Raw;
  target_lemma: string;
}

const RefPassage: React.FC<RefPassageProps> = ({
  depth,
  bible,
  raw,
  target_lemma,
}) => {
  const conf = bible.conf;
  const direction = conf?.Direction === 'RtoL' && 'rtl';
  const lang = bible.lang;

  return (
    <div className={clsx('border-b p-2', direction, lang)}>
      <Passage
        raw={raw}
        showPosition="none"
        target_lemma={target_lemma}
        lang={lang}
        depth={depth}
      />
    </div>
  );
};

type RawTexts = { [pos: string]: { [modname: string]: Raw[] } };

interface RefPassagesProps {
  depth: number;
  indexes: string[];
  mod_key: string;
  lemma: string;
}

const RefPassages: React.FC<RefPassagesProps> = ({
  depth,
  indexes,
  mod_key,
  lemma,
}) => {
  const [raw_texts, setRawTexts] = useState<RawTexts>({});
  const { bibles, layouts } = useContext(AppContext);
  const modnames = layouts
    .flat()
    .filter((item) => item.type === 'bible')
    .map((item) => item.modname);

  useEffect(() => {
    const f = async () => {
      let new_raw_texts: RawTexts = {};
      for (const book_pos of indexes) {
        new_raw_texts[book_pos] = {};
        for (const modKey of modnames) {
          try {
            const raws = await bibles[modKey].renderText(book_pos, {
              footnotes: false,
              crossReferences: true,
              oneVersePerLine: true,
              headings: true,
              wordsOfChristInRed: true,
              intro: true,
              array: false,
            });
            if (raws) new_raw_texts[book_pos][modKey] = raws;
          } catch (error) {
            console.log(error);
          }
        }
      }
      setRawTexts(new_raw_texts);
    };
    f();
  }, [indexes, bibles, mod_key, modnames]);

  const localizeBookPos = (book_pos: string) => {
    const canonjp: {
      [key: string]: { abbrev: string; name: string };
    } = canon_jp;
    const reg = /^(\w+).(\d+:\d+)$/;
    const m = book_pos.match(reg);

    if (m && m[1] && m[2]) {
      const name = canonjp[m[1]]?.abbrev;
      return !!name ? name + m[2] : book_pos;
    } else {
      return book_pos;
    }
  };

  return (
    <div>
      {indexes.map((book_pos: string, key: number) => (
        <div
          key={key}
          className="rounded-md border border-gray-300 shadow mb-2 p-2 bg-white"
        >
          <h5>
            <b>{localizeBookPos(book_pos)}</b>
          </h5>
          {modnames.map(
            (modKey) =>
              raw_texts[book_pos] &&
              raw_texts[book_pos][modKey] &&
              raw_texts[book_pos][modKey].map((raw) => {
                return (
                  <RefPassage
                    depth={depth}
                    bible={bibles[modKey]}
                    raw={raw}
                    target_lemma={lemma}
                  />
                );
              })
          )}
        </div>
      ))}
    </div>
  );
};

interface ModalDictIndexProps {
  depth: number;
  lemma: string;
  osisLocations: {
    [modname: string]: OsisLocation;
  };
  open: boolean;
  onClose: () => void;
}

const ModalDictIndex: React.FC<ModalDictIndexProps> = ({
  depth,
  lemma,
  osisLocations,
  open,
  onClose,
}) => {
  const [indexes, setIndexes] = useState<string[]>([]);
  const [target, setTarget] = useState<{
    mod_key: string | null;
    book: string | null;
  }>({
    mod_key: null,
    book: null,
  });
  const [page, setPage] = useState<number>(1);
  const counts = countByModKey(osisLocations);
  const count_per_page = 10;
  const page_count = Math.ceil(indexes.length / count_per_page);
  const start_index = count_per_page * (page - 1);
  const target_indexes = indexes.slice(
    start_index,
    start_index + count_per_page
  );
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;

  const references_options = Object.keys(osisLocations)
    .map((modKey: string) =>
      Object.keys(osisLocations[modKey]).map((book) => ({
        mod_key: modKey,
        book,
      }))
    )
    .flat(1)
    .filter((di) => di.mod_key !== 'lemma');

  const options = references_options.map((option) => ({
    label: `${canonjp[option.book].abbrev}(${option.mod_key})  x${
      counts[option.mod_key][option.book]
    }`,
    value: `${option.mod_key}:${option.book}`,
  }));

  useEffect(() => {
    const references2 = osisLocations || {};
    const modKey = Object.keys(references2)[0];
    const book = Object.keys(references2[modKey] || {})[0];
    setTarget({ mod_key: modKey, book: book });
    setIndexes(bookDictIndex(modKey, book));
    setPage(1);
  }, [osisLocations]);

  const bookDictIndex = (modKey: string, book: string) => {
    let indexes = [];
    const book_indexes = ((osisLocations || {})[modKey] || {})[book];
    for (let chapter in book_indexes) {
      for (let verse in book_indexes[chapter]) {
        indexes.push(`${book}.${chapter}:${verse}`);
      }
    }
    return indexes;
  };

  const onChangeTarget = (
    e: React.ChangeEvent<{ name?: string; value: unknown }>
  ) => {
    if (e.target && e.target.value && typeof e.target.value == 'string') {
      const [modKey, book] = e.target.value.split(':');
      setTarget({ mod_key: modKey, book: book });
      setIndexes(bookDictIndex(modKey, book));
      setPage(1);
    }
  };

  const onChangePage = (e: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Modal open={open} onClose={onClose} size="max">
      <Modal.Header padding={0} onClose={onClose}>
        <div className="inline-block w-1/2 text-center p-2">語彙＆参照箇所</div>
        <div className="inline-block w-1/2 pl-4 pr-0 py-1">
          <Flex justify_content="between">
            <Form.Select
              value={`${target.mod_key}:${target.book}`}
              options={options}
              onChange={onChangeTarget}
              size="sm"
              className="ml-3"
            />
            <Pagination
              size="sm"
              count={page_count}
              page={page}
              onChange={(v) => setPage(v)}
            />
          </Flex>
        </div>
      </Modal.Header>
      <Modal.Body padding={0} className="bg-gray-50">
        <Grid cols={2}>
          <div
            className="p-2 overflow-y-scroll"
            style={{ height: 'calc(100vh - 100px)' }}
          >
            <DictView depth={depth} />
          </div>
          <div
            className="p-2 overflow-y-scroll"
            style={{ height: 'calc(100vh - 100px)' }}
          >
            {target.mod_key && (
              <RefPassages
                depth={depth}
                indexes={target_indexes}
                mod_key={target.mod_key}
                lemma={lemma}
              />
            )}
          </div>
        </Grid>
      </Modal.Body>
    </Modal>
  );
};

interface BibleReferenceProps {
  lemma: string;
  depth: number;
}

const BibleReference: React.FC<BibleReferenceProps> = ({ lemma, depth }) => {
  const [osisLocations, setOsisLocations] = useState<{
    [modname: string]: OsisLocation;
  }>({});
  const [label, setLabel] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const { bibles } = useContext(AppContext);

  useEffect(() => {
    const f = async () => {
      if (lemma) {
        const tasks = Object.entries(bibles).map(async ([modname, bible]) => {
          const reference = await bible.getReference(lemma);
          return { modname, reference };
        });
        const result = await Promise.all(tasks);
        let locations: {
          [modname: string]: OsisLocation;
        } = {};
        result.forEach(({ modname, reference }) => {
          if (reference) locations[modname] = reference;
        });
        setOsisLocations(locations);
        const counts = countByModKey(locations);
        // console.log({ new_references, counts });
        const new_label = Object.keys(counts)
          .map(
            (modname) =>
              `${modname}(${Object.values(counts[modname]).reduce(
                (i, j) => i + j,
                0
              )})`
          )
          .join(' ');
        setLabel(new_label);
      } else {
        setOsisLocations({});
        setLabel('');
      }
    };
    f();
  }, [lemma, bibles]);

  if (!lemma) return null;

  return (
    <>
      <Button
        color="none"
        size="none"
        className="text-xs rounded-full border border-gray-400 px-2 py-0.5 w-max"
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      {open && (
        <ModalDictIndex
          depth={depth}
          lemma={lemma}
          osisLocations={osisLocations}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default BibleReference;
