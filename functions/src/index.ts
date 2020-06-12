import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp(functions.config().firebase);

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const onCreateUser = functions
  .region('asia-northeast1')
  .auth.user()
  .onCreate(async (user) => {
    const batch = admin.firestore().batch();
    batch.set(admin.firestore().doc(`users/${user.uid}`), {
      nickname: null,
      sex: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return batch.commit();
  });
