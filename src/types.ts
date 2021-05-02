import firebase from './firebase';
import 'firebase/firestore';

export interface CustomClaims {
  role?: 'manager' | 'admin';
}

export interface Article {
  subject: string;
  body: string;
  heading: string;
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  createdAt?: firebase.firestore.Timestamp;
  updatedAt?: firebase.firestore.Timestamp;
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
}

export interface TargetType {
  book: string;
  chapter: number;
  verse?: number;
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
