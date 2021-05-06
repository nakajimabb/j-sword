import firebase from './firebase';
import 'firebase/firestore';

export interface CustomClaims {
  role?: 'manager' | 'admin';
}

export type ModType = 'bible' | 'dictionary' | 'morphology';

export interface Module {
  modname: string;
  modtype: ModType;
  secrecy: 'public' | 'protected' | 'private';
  title: string;
  lang: 'ja' | 'he' | 'grc' | 'en';
  dependencies: string[];
  path: string;
  referencePath?: string;
}

export interface Book {
  title: string;
  published: boolean;
  headings: {id:string, item: string, title: string}[];
}

export interface Article {
  part?: number;
  chapter?: number;
  section?: number;
  title: string;
  content: string;
  published: boolean;
}

export interface TargetType {
  book: string;
  chapter: string;
  verse?: string;
}

export type Layout = {
  modname: string;  // or docId
  type: 'bible' | 'dictionary' | 'book';
};

export interface Setting {
  name: string;
  target: TargetType;
  layouts: Layout[][];
}
