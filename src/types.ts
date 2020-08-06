import firebase from './firebase';
import 'firebase/firestore';

export interface CustomClaims {
  admin?: boolean | null;
}

export interface Article {
  subject: string;
  body: string;
  createdAt: firebase.firestore.Timestamp;
  updatedAt: firebase.firestore.Timestamp;
}
