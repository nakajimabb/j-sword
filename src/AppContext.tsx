import React, { useState, useEffect, createContext } from 'react';

import firebase from './firebase';
import { CustomClaims, Target, TargetWord, Layout, Book } from './types';
import { OsisLocation } from './sword/types';
import { getOsisLocations } from './OsisLocation';
import Sword from './sword/Sword';
import SettingDB from './SettingDB';
import TargetHistory from './TargetHistory';

export type ContextType = {
  bibles: { [key: string]: Sword };
  dictionaries: { [key: string]: Sword };
  morphologies: { [key: string]: Sword };
  setSwordModule: (module: Sword) => void;
  currentUser: firebase.User | null;
  customClaims: CustomClaims;
  targetHistory: TargetHistory;
  setTargetHistory: React.Dispatch<React.SetStateAction<TargetHistory>>;
  layouts: Layout[][];
  setLayouts: React.Dispatch<React.SetStateAction<Layout[][]>>;
  saveSetting: (history: Target[], layouts: Layout[][], name?: string) => void;
  targetWord: TargetWord;
  setTargetWord: React.Dispatch<React.SetStateAction<TargetWord>>;
  touchDevice: boolean;
  loadModules: () => void;
  selectLayout: Layout | null;
  setSelectLayout: (layout: Layout | null) => void;
  books: { [docId: string]: Book } | null;
  loadBooks: (reload: boolean) => Promise<{ [docId: string]: Book } | null>;
  interlocked: boolean;
  setInterlocked: React.Dispatch<React.SetStateAction<boolean>>;
  osisLocations: { [modname: string]: OsisLocation };
  setOsisLocations: React.Dispatch<
    React.SetStateAction<{
      [modname: string]: OsisLocation;
    }>
  >;
  targetOsisRefs: string[];
  setTargetOsisRefs: React.Dispatch<React.SetStateAction<string[]>>;
  loadSetting: (name: string) => void;
  updateTargetHistory: (targetHistory: TargetHistory, save: boolean) => void;
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
  targetWord: {
    lemma: '',
    morph: '',
    text: '',
    fixed: false,
  },
  setTargetWord: (value: TargetWord) => {},
  touchDevice: false,
  loadModules: () => {},
  selectLayout: null,
  setSelectLayout: (layout: Layout | null) => {},
  books: null,
  loadBooks: async (reload: boolean) => ({}),
  interlocked: true,
  setInterlocked: (interlocked: boolean) => {},
  osisLocations: {},
  setOsisLocations: (locations: { [modname: string]: OsisLocation }) => {},
  targetOsisRefs: [],
  setTargetOsisRefs: (positions: string[]) => {},
  loadSetting: (name: string) => {},
  updateTargetHistory: (targetHistory: TargetHistory, save: boolean) => {},
} as ContextType);

export const AppContextProvider: React.FC = (props) => {
  const [bibles, setBibles] = useState<{ [key: string]: Sword }>({});
  const [dictionaries, setDictionaries] = useState({});
  const [morphologies, setMorphologies] = useState({});
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
  const [customClaims, setCustomClaims] = useState<CustomClaims>({});
  const [touchDevice, SetTouchDevice] = useState<boolean>(false);
  const [layouts, setLayouts] = useState<Layout[][]>([]);

  const [targetWord, setTargetWord] = useState<TargetWord>({
    lemma: '',
    morph: '',
    text: '',
    fixed: false,
  });
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
        loadSetting('&last');
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

  const loadSetting = async (name: string) => {
    const setting = await SettingDB.getSetting(name);
    if (setting) {
      if (setting.history) {
        const history = setting.history;
        if (history && history.length > 0) {
          setTargetHistory(new TargetHistory(history, history.length - 1));
          const current = history[history.length - 1];
          if (current.mode === 'word') {
            const word: TargetWord = {
              lemma: current.search,
              morph: '',
              text: '',
              fixed: true,
            };
            setTargetWord(word);
          }
        }
      }
      if (setting.layouts) {
        setLayouts(setting.layouts);
      }
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

  const updateTargetHistory = async (
    targetHistory: TargetHistory,
    save: boolean
  ) => {
    targetHistory = targetHistory.dup();
    setTargetHistory(targetHistory);
    const current = targetHistory.current();
    if (current) {
      if (current.mode === 'word') {
        setTargetWord({
          lemma: current.search,
          morph: '',
          text: '',
          fixed: true,
        });
        const locations = await getOsisLocations(bibles, current.search);
        if (locations) setOsisLocations(locations);
      }
      if (save) saveSetting(targetHistory.history, layouts);
    }
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
        targetWord,
        setTargetWord,
        touchDevice,
        loadModules,
        selectLayout,
        setSelectLayout,
        books,
        loadBooks,
        interlocked,
        setInterlocked,
        osisLocations,
        setOsisLocations,
        targetOsisRefs,
        setTargetOsisRefs,
        loadSetting,
        updateTargetHistory,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContext;
