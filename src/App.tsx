import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import SignIn from './SignIn';
import { AppContextProvider } from './AppContext';

import AppBar from './AppBar';
import GridLayout from './GridLayout';
import Tailwind from './Tailwind';
import './App.css';
import './passage.css';

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <AppContextProvider>
        <Router>
          <Route path="/" component={AppBar} />
          <Route exact path="/" component={GridLayout} />
          <Route exact path="/sign_in" component={SignIn} />
          <Route exact path="/tailwind" component={Tailwind} />
        </Router>
      </AppContextProvider>
    </React.StrictMode>
  );
};

export default App;
