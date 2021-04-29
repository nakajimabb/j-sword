import React, { useState, useEffect, createContext } from 'react';

import firebase from './firebase';
import { CustomClaims, TargetType, Layout, Setting } from './types';
import Sword from './sword/Sword';
import SettingDB from './SettingDB';

export interface Word {
  lemma: string;
  morph: string;
  text: string;
  lang: string;
  targetLemma: string;
  fixed: boolean;
}

export type MenuMode = 'bible' | 'truth' | 'hebrew';

export interface ContextType {
  bibles: { [key: string]: Sword };
  dictionaries: { [key: string]: Sword };
  morphologies: { [key: string]: Sword };
  setSwordModule: (module: Sword) => void;
  currentUser: firebase.User | null;
  customClaims: CustomClaims;
  target: TargetType;
  setTarget: React.Dispatch<TargetType>;
  layouts: Layout[][];
  setLayouts: (layouts: Layout[][]) => void;
  saveSetting: (target: TargetType, layouts: Layout[][], name?: string) => void;
  targetWords: Word[];
  setTargetWords: React.Dispatch<Word[]>;
  touchDevice: boolean;
  currentMode: MenuMode;
  setCurrentMode: React.Dispatch<MenuMode>;
  loadModules: () => void;
  selectLayout: Layout | null;
  setSelectLayout: (layout: Layout | null) => void;
}

const AppContext = createContext({
  bibles: {},
  dictionaries: {},
  morphologies: {},
  setSwordModule: (module: Sword) => {},
  currentUser: null,
  customClaims: {},
  target: { book: '', chapter: 1 },
  setTarget: (target: TargetType) => {},
  layouts: [],
  setLayouts: (layouts: Layout[][]) => {},
  saveSetting: (
    target: TargetType,
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
} as ContextType);

export const AppContextProvider: React.FC = (props) => {
  const [bibles, setBibles] = useState({});
  const [dictionaries, setDictionaries] = useState({});
  const [morphologies, setMorphologies] = useState({});
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
  const [customClaims, setCustomClaims] = useState<CustomClaims>({});
  const [touchDevice, SetTouchDevice] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<MenuMode>('bible');
  const [target, setTarget] = useState<TargetType>({
    book: 'Gen',
    chapter: 1,
  });
  const [layouts, setLayouts] = useState<Layout[][]>([]);

  const [targetWords, setTargetWords] = useState<Word[]>([
    { lemma: '', morph: '', text: '', lang: '', targetLemma: '', fixed: false },
  ]);
  const [selectLayout, setSelectLayout] = useState<Layout | null>(null);

  useEffect(() => {
    SetTouchDevice(window.ontouchstart === null);
  }, []);

  useEffect(() => {
    const f = async () => {
      await loadModules();
      firebase.auth().onAuthStateChanged(async (user) => {
        setCurrentUser(user);
        const setting = await SettingDB.getSetting('&last');
        if (setting) {
          setTarget(setting.target);
          setLayouts(setting.layouts);
        } else {
          resetTarget();
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

  const resetTarget = () => {
    setTarget({
      book: 'Gen',
      chapter: 1,
    });
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

  const saveSetting = async (
    target: TargetType,
    layouts: Layout[][],
    name: string = '&last'
  ) => {
    await SettingDB.saveSetting({ target, layouts, name });
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
        target,
        setTarget,
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
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContext;
