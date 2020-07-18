import React, { useState, useEffect, createContext } from 'react';
import firebase from './firebase';
import Sword from './sword/Sword';
import SAMPLE_MODULES from './config/sample_modules';

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

export interface ContextType {
  bibles: { [key: string]: Sword };
  dictionaries: { [key: string]: Sword };
  morphologies: { [key: string]: Sword };
  setSwordModule: (module: Sword) => void;
  currentUser: firebase.User | null;
  target: TargetType;
  setTarget: React.Dispatch<TargetType>;
  targetWords: Word[];
  setTargetWords: React.Dispatch<Word[]>;
  sample_modules: { [key: string]: string };
}

const AppContext = createContext({
  bibles: {},
  dictionaries: {},
  morphologies: {},
  setSwordModule: (module: Sword) => {},
  currentUser: null,
  target: { mod_keys: [], book: '', chapter: '', verse: '' },
  setTarget: (value: TargetType) => {},
  targetWords: [],
  setTargetWords: (value: Word[]) => {},
  sample_modules: {},
} as ContextType);

export const AppContextProvider: React.FC = (props) => {
  const [bibles, setBibles] = useState({});
  const [dictionaries, setDictionaries] = useState({});
  const [morphologies, setMorphologies] = useState({});
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
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
    const f = async () => {
      const new_bibles = await Sword.loadAll('bible');
      for (const modname in SAMPLE_MODULES) {
        if (!new_bibles[modname]) {
          new_bibles[modname] = new Sword(
            modname,
            'bible',
            SAMPLE_MODULES[modname]
          );
        }
      }
      setBibles(new_bibles);
      const new_dictionaries = await Sword.loadAll('dictionary');
      setDictionaries(new_dictionaries);
      const new_morphologies = await Sword.loadAll('morphology');
      setMorphologies(new_morphologies);
      firebase.auth().onAuthStateChanged((user) => setCurrentUser(user));
    };
    f();
  }, []);

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
        target,
        setTarget,
        targetWords,
        setTargetWords,
        sample_modules: SAMPLE_MODULES,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContext;
