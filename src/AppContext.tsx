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

export interface AnnotateType {
  content: string;
  attributes: Attr[];
}

export interface ContextType {
  bibles: { [key: string]: Sword };
  dictionaries: { [key: string]: Sword };
  morphologies: { [key: string]: Sword };
  currentUser: firebase.User | null;
  target: TargetType;
  setTarget: React.Dispatch<TargetType>;
  annotate: AnnotateType;
  setAnnotate: React.Dispatch<AnnotateType>;
  module_urls: { [modname: string]: { [key: string]: string } };
}

const AppContext = createContext({
  bibles: {},
  dictionaries: {},
  morphologies: {},
  currentUser: null,
  target: { mod_keys: [], book: '', chapter: '', verse: '' },
  setTarget: (value: TargetType) => {},
  annotate: { content: '', attributes: [] },
  setAnnotate: (value: AnnotateType) => {},
  module_urls: {},
} as ContextType);

export const AppContextProvider: React.FC = (props) => {
  const [bibles, setBibles] = useState({});
  const [dictionaries, setDictionaries] = useState({});
  const [morphologies, setMorphologies] = useState({});
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
  const [target, setTarget] = useState<TargetType>({
    mod_keys: [],
    book: 'John',
    chapter: '1',
    verse: '1',
  });
  const [annotate, setAnnotate] = useState<AnnotateType>({
    content: '',
    attributes: [],
  });

  useEffect(() => {
    const f = async () => {
      const new_bibles = await Sword.loadAll('bible');
      for (const modname in SAMPLE_MODULES) {
        if (!new_bibles[modname]) {
          new_bibles[modname] = new Sword(modname, 'bible');
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

  return (
    <AppContext.Provider
      value={{
        bibles,
        dictionaries,
        morphologies,
        currentUser,
        target,
        setTarget,
        annotate,
        setAnnotate,
        module_urls: SAMPLE_MODULES,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContext;
