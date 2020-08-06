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

const authorized = async (
  authType: 'anonymous' | 'authenticated' | 'admin',
  context: functions.https.CallableContext
) => {
  if (authType === 'anonymous') {
    return true;
  } else {
    if (context.auth) {
      if (authType === 'authenticated') {
        return true;
      } else {
        const uid = context.auth.uid;
        const userRecord = await admin.auth().getUser(uid);
        const claimAdmin = userRecord.customClaims?.admin;
        if (authType === 'admin' && claimAdmin) {
          return true;
        } else {
          throw new functions.https.HttpsError(
            'permission-denied',
            '権限がありません。'
          );
        }
      }
    } else {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'ログインしてください。'
      );
    }
  }
};

// onCall function を返すデコレータ
const callable = (
  authType: 'anonymous' | 'authenticated' | 'admin',
  func: (data: any, context: functions.https.CallableContext) => any
) => {
  return functions.region('asia-northeast1').https.onCall((data, context) => {
    const f = async () => {
      try {
        const auth = await authorized(authType, context);
        if (auth) {
          const result = await func(data, context);
          return result;
        }
      } catch (error) {
        throw new functions.https.HttpsError(
          error.code || 'unknown',
          error.message || 'エラーが発生しました。',
          error
        );
      }
    };
    return f();
  });
};

exports.getAuthUserList = callable('admin', async (data, context) => {
  const listUsersResult = await admin.auth().listUsers();
  return listUsersResult.users;
});
