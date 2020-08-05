import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core';
import clsx from 'clsx';

import AppContext from './AppContext';
import TopBar from './TopBar';
import Navigation from './Navigation';
import BibleViewer from './BibleViewer';
import ArticleList from './ArticleList';
import './App.css';
import './passage.css';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
  },
  hidden: {
    display: 'none',
  },
}));

const App: React.FC = () => {
  const { currentMode } = useContext(AppContext);
  const classes = useStyles();

  return (
    <div id="App">
      <TopBar />
      <div className={clsx(currentMode !== 'bible' && classes.hidden)}>
        <BibleViewer />
      </div>
      <div className={clsx(currentMode !== 'truth' && classes.hidden)}>
        <ArticleList />
      </div>
      <Navigation />
    </div>
  );
};

export default App;
