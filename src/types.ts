import firebase from './firebase';
import 'firebase/firestore';

export interface CustomClaims {
  admin?: boolean | null;
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
  title: string;
  lang: string;
  dependencies: string[];
  path: string;
  referencePath?: string;
}
