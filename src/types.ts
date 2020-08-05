import firebase from './firebase';
import 'firebase/firestore';

export interface Article {
  subject: string;
  body: string;
  createdAt: firebase.firestore.Timestamp;
  updatedAt: firebase.firestore.Timestamp;
}
