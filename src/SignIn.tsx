import React from 'react';

import firebase from './firebase';
import 'firebase/auth';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';

import { Flex } from './components';

const uiConfig = {
  signInFlow: 'redirect',
  signInSuccessUrl: '/',
  signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
};

const SignInScreen: React.FC = () => {
  return (
    <Flex
      justify_content="center"
      align_items="center"
      className="w-full h-screen"
    >
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
    </Flex>
  );
};

export default SignInScreen;
