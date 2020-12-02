import React, { useState, useEffect, createContext } from 'react';

import firebase from './firebase';
import { CustomClaims, TargetType } from './types';
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
  saveSetting: React.Dispatch<TargetType>;
  targetWords: Word[];
  setTargetWords: React.Dispatch<Word[]>;
  touchDevice: boolean;
  currentMode: MenuMode;
  setCurrentMode: React.Dispatch<MenuMode>;
  loadModules: () => void;
}

const AppContext = createContext({
  bibles: {},
  dictionaries: {},
  morphologies: {},
  setSwordModule: (module: Sword) => {},
  currentUser: null,
  customClaims: {},
  target: { modnames: [], book: '', chapter: '', verse: '' },
  saveSetting: (value: TargetType) => {},
  targetWords: [],
  setTargetWords: (value: Word[]) => {},
  touchDevice: false,
  currentMode: 'bible',
  setCurrentMode: (value: MenuMode) => {},
  loadModules: () => {},
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
    modnames: [],
    book: 'Gen',
    chapter: '1',
    verse: '',
  });

  const [targetWords, setTargetWords] = useState<Word[]>([
    { lemma: '', morph: '', text: '', lang: '', targetLemma: '', fixed: false },
  ]);

  useEffect(() => {
    SetTouchDevice(window.ontouchstart === null);
  }, []);

  useEffect(() => {
    const f = async () => {
      await loadModules();
      firebase.auth().onAuthStateChanged(async (user) => {
        setCurrentUser(user);
        const uid = user ? user.uid : 'anonymous';
        const setting = await SettingDB.getSetting(uid);
        if (setting && setting.target) {
          setTarget(setting.target);
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
      modnames: [],
      book: 'Gen',
      chapter: '1',
      verse: '',
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

  const saveSetting = async (value: TargetType) => {
    setTarget(value);
    await SettingDB.saveSetting({
      uid: currentUser ? currentUser.uid : 'anonymous',
      target: value,
    });
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
        saveSetting,
        targetWords,
        setTargetWords,
        touchDevice,
        currentMode,
        setCurrentMode,
        loadModules,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContext;
