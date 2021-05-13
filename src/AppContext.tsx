import React, { useState, useEffect, createContext } from 'react';

import firebase from './firebase';
import { CustomClaims, Target, Layout, Book } from './types';
import { OsisLocation } from './sword/types';
import Sword from './sword/Sword';
import SettingDB from './SettingDB';
import TargetHistory from './TargetHistory';
import { parseWordTarget } from './sword/parseTarget';

export type Word = {
  lemma: string;
  morph: string;
  text: string;
  lang: string;
  targetLemma: string;
  fixed: boolean;
};

export type MenuMode = 'bible' | 'truth' | 'hebrew';

export type ContextType = {
  bibles: { [key: string]: Sword };
  dictionaries: { [key: string]: Sword };
  morphologies: { [key: string]: Sword };
  setSwordModule: (module: Sword) => void;
  currentUser: firebase.User | null;
  customClaims: CustomClaims;
  targetHistory: TargetHistory;
  setTargetHistory: React.Dispatch<TargetHistory>;
  layouts: Layout[][];
  setLayouts: (layouts: Layout[][]) => void;
  saveSetting: (history: Target[], layouts: Layout[][], name?: string) => void;
  targetWords: Word[];
  setTargetWords: React.Dispatch<Word[]>;
  touchDevice: boolean;
  currentMode: MenuMode;
  setCurrentMode: React.Dispatch<MenuMode>;
  loadModules: () => void;
  selectLayout: Layout | null;
  setSelectLayout: (layout: Layout | null) => void;
  books: { [docId: string]: Book } | null;
  loadBooks: (reload: boolean) => Promise<{ [docId: string]: Book } | null>;
  interlocked: boolean;
  setInterlocked: React.Dispatch<boolean>;
  osisLocations: { [modname: string]: OsisLocation };
  targetOsisRefs: string[];
  setTargetOsisRefs: React.Dispatch<string[]>;
};

const AppContext = createContext({
  bibles: {},
  dictionaries: {},
  morphologies: {},
  setSwordModule: (module: Sword) => {},
  currentUser: null,
  customClaims: {},
  targetHistory: new TargetHistory(),
  setTargetHistory: (targetHistory: TargetHistory) => {},
  layouts: [],
  setLayouts: (layouts: Layout[][]) => {},
  saveSetting: (
    history: Target[],
    layouts: Layout[][],
    name: string = '&last'
  ) => {},
  targetWords: [],
  setTargetWords: (value: Word[]) => {},
  touchDevice: false,
  currentMode: 'bible',
  setCurrentMode: (value: MenuMode) => {},
  loadModules: () => {},
  selectLayout: null,
  setSelectLayout: (layout: Layout | null) => {},
  books: null,
  loadBooks: async (reload: boolean) => ({}),
  interlocked: true,
  setInterlocked: (interlocked: boolean) => {},
  osisLocations: {},
  targetOsisRefs: [],
  setTargetOsisRefs: (positions: string[]) => {},
} as ContextType);

export const AppContextProvider: React.FC = (props) => {
  const [bibles, setBibles] = useState<{ [key: string]: Sword }>({});
  const [dictionaries, setDictionaries] = useState({});
  const [morphologies, setMorphologies] = useState({});
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
  const [customClaims, setCustomClaims] = useState<CustomClaims>({});
  const [touchDevice, SetTouchDevice] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<MenuMode>('bible');
  const [layouts, setLayouts] = useState<Layout[][]>([]);

  const [targetWords, setTargetWords] = useState<Word[]>([
    { lemma: '', morph: '', text: '', lang: '', targetLemma: '', fixed: false },
  ]);
  const [selectLayout, setSelectLayout] = useState<Layout | null>(null);
  const [books, setBooks] = useState<{ [docId: string]: Book } | null>(null);
  const [interlocked, setInterlocked] = useState(true);
  const [targetHistory, setTargetHistory] = useState<TargetHistory>(
    new TargetHistory()
  );
  const [osisLocations, setOsisLocations] = useState<{
    [modname: string]: OsisLocation;
  }>({});
  const [targetOsisRefs, setTargetOsisRefs] = useState<string[]>([]);

  const admin = customClaims?.role === 'admin';

  useEffect(() => {
    SetTouchDevice(window.ontouchstart === null);
  }, []);

  useEffect(() => {
    const f = async () => {
      await loadModules();
    };
    f();
  }, []);

  useEffect(() => {
    const f = async () => {
      firebase.auth().onAuthStateChanged(async (user) => {
        setCurrentUser(user);
        const setting = await SettingDB.getSetting('&last');
        if (setting) {
          if (setting.history) {
            const history = setting.history;
            if (history && history.length > 0) {
              setTargetHistory(new TargetHistory(history, history.length - 1));
              const current = history[history.length - 1];
              if (current.mode === 'word') {
                const position = current.search;
                const lang = position[0] === 'H' ? 'he' : 'grc';
                const word: Word = {
                  lemma: position,
                  morph: '',
                  text: '',
                  lang,
                  targetLemma: position,
                  fixed: true,
                };
                setTargetWords([word]);
              }
            }
          }
          if (setting.layouts) {
            setLayouts(setting.layouts);
          }
        }
        try {
          if (user) {
            const token = await user.getIdTokenResult();
            setCustomClaims(token.claims || {});
          } else {
            setCustomClaims({});
          }
        } catch (error) {
          setCustomClaims({});
        }
      });
    };
    f();
  }, []);

  useEffect(() => {
    const current = targetHistory.current();
    if (current) {
      if (current.mode === 'word') {
        updateOsisLocations(current.search);
      }
    }
  }, [targetHistory]);

  const UnionOsisRefs = (refs1: OsisLocation, refs2: OsisLocation) => {
    const refs = { ...refs1 };
    Object.entries(refs2).forEach(([book, cvRef]) => {
      if (refs[book]) {
        Object.entries(cvRef).forEach(([chap, vRef]) => {
          if (refs[book][+chap]) {
            Object.entries(vRef).forEach(([vers, cnt]) => {
              if (refs[book][+chap][+vers]) {
                refs[book][+chap][+vers] =
                  Number(refs[book][+chap][+vers]) + Number(cnt);
              } else {
                refs[book][+chap][+vers] = cnt;
              }
            });
          } else {
            refs[book][+chap] = vRef;
          }
        });
      } else {
        refs[book] = cvRef;
      }
    });
    return refs;
  };

  const IntersecOsisRefs = (refs1: OsisLocation, refs2: OsisLocation) => {
    console.log({ refs1, refs2 });
    const refs: OsisLocation = {};
    Object.entries(refs2).forEach(([book, cvRef]) => {
      if (refs1[book]) {
        Object.entries(cvRef).forEach(([chap, vRef]) => {
          if (refs1[book][+chap]) {
            Object.entries(vRef).forEach(([vers, cnt]) => {
              if (refs1[book][+chap][+vers]) {
                if (!refs[book]) refs[book] = {};
                if (!refs[book][+chap]) refs[book][+chap] = {};
                refs[book][+chap][+vers] =
                  Number(refs1[book][+chap][+vers]) + Number(cnt);
              }
            });
          }
        });
      }
    });
    return refs;
  };

  const updateOsisLocations = async (search: string) => {
    const res = parseWordTarget(search);
    if (res) {
      const { lemmas, separator } = res;
      const tasks = Object.entries(bibles).map(async ([modname, bible]) => {
        let loc: OsisLocation | null = null;
        for await (const lemma of lemmas) {
          const refers = await bible.getReference(lemma);
          if (refers) {
            if (loc) {
              if (separator === ',') loc = UnionOsisRefs(loc, refers);
              else loc = IntersecOsisRefs(loc, refers);
            } else {
              loc = refers;
            }
          }
        }
        return { modname, loc };
      });
      const result = await Promise.all(tasks);
      let locations: { [modname: string]: OsisLocation } = {};
      result.forEach(({ modname, loc }) => {
        if (loc) locations[modname] = loc;
      });
      setOsisLocations(locations);
    }
  };

  const loadModules = async () => {
    const new_bibles = await Sword.loadAll('bible');
    setBibles(new_bibles);
    const new_dictionaries = await Sword.loadAll('dictionary');
    setDictionaries(new_dictionaries);
    const new_morphologies = await Sword.loadAll('morphology');
    setMorphologies(new_morphologies);
  };

  const setSwordModule = (module: Sword) => {
    switch (module.modtype) {
      case 'bible':
        setBibles({ ...bibles, [module.modname]: module });
        break;
      case 'dictionary':
        setDictionaries({ ...dictionaries, [module.modname]: module });
        break;
      case 'morphology':
        setMorphologies({ ...morphologies, [module.modname]: module });
        break;
    }
  };

  const loadBooks = async (reload: boolean = false) => {
    if (!books || reload) {
      try {
        const db = firebase.firestore();
        // 社員情報保存
        const newBooks: { [docId: string]: Book } = {};
        const query = admin
          ? db.collection('books').get()
          : db.collection('books').where('published', '==', true).get();
        const snapshot = await query;
        snapshot.forEach((doc) => {
          newBooks[doc.id] = doc.data() as Book;
        });
        setBooks(newBooks);
        console.log({ newBooks });
        return newBooks;
      } catch (error) {
        console.log({ error });
        alert(error.message || 'エラーが発生しました。');
      }
    }
    return books;
  };

  const saveSetting = async (
    history: Target[],
    layouts: Layout[][],
    name: string = '&last'
  ) => {
    await SettingDB.saveSetting({ history, layouts, name });
  };

  return (
    <AppContext.Provider
      value={{
        bibles,
        dictionaries,
        morphologies,
        setSwordModule,
        currentUser,
        customClaims,
        targetHistory,
        setTargetHistory,
        layouts,
        setLayouts,
        saveSetting,
        targetWords,
        setTargetWords,
        touchDevice,
        currentMode,
        setCurrentMode,
        loadModules,
        selectLayout,
        setSelectLayout,
        books,
        loadBooks,
        interlocked,
        setInterlocked,
        osisLocations,
        targetOsisRefs,
        setTargetOsisRefs,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContext;
