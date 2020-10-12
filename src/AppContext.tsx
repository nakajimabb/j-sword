import React, { useState, useEffect, createContext } from 'react';

import firebase from './firebase';
import { CustomClaims } from './types';
import Sword from './sword/Sword';

interface TargetType {
  mod_keys: string[];
  book: string;
  chapter: string;
  verse?: string;
}

export interface Word {
  lemma: string;
  morph: string;
  text: string;
  lang: string;
  targetLemma: string;
  fixed: boolean;
}

export type MenuMode =
  | 'bible'
  | 'truth'
  | 'kirishitan'
  | 'worship'
  | 'ministry';

export interface ContextType {
  bibles: { [key: string]: Sword };
  dictionaries: { [key: string]: Sword };
  morphologies: { [key: string]: Sword };
  setSwordModule: (module: Sword) => void;
  currentUser: firebase.User | null;
  customClaims: CustomClaims;
  target: TargetType;
  setTarget: React.Dispatch<TargetType>;
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
  target: { mod_keys: [], book: '', chapter: '', verse: '' },
  setTarget: (value: TargetType) => {},
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
    mod_keys: [],
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
      firebase.auth().onAuthStateChanged((user) => {
        setCurrentUser(user);
        if (user) {
          user
            .getIdTokenResult()
            .then((token) => {
              setCustomClaims(token.claims || {});
            })
            .catch((error) => {
              setCustomClaims({});
            });
        } else {
          setCustomClaims({});
        }
      });
    };
    f();
  }, []);

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
