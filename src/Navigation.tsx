import React, { useContext } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  makeStyles,
} from '@material-ui/core';

import AppContext from './AppContext';
import './App.css';
import './passage.css';

const useStyles = makeStyles((theme) => ({
  navi: {
    margin: 'auto',
    width: '100%',
    position: 'fixed',
    bottom: 0,
  },
  hide: {
    display: 'none',
  },
  label: {
    fontSize: '85%',
  },
  selected: {
    backgroundColor: 'ghostwhite',
    border: '1px solid aliceblue',
  },
}));

const Navigation: React.FC = () => {
  const { currentMode, setCurrentMode } = useContext(AppContext);
  const classes = useStyles();

  return (
    <BottomNavigation
      showLabels
      value={currentMode}
      onChange={(e, v) => setCurrentMode(v)}
      className={classes.navi}
    >
      <BottomNavigationAction
        label={<span className={classes.label}>聖書</span>}
        value="bible"
        icon={<img src="volume.png" alt="" style={{ height: 32 }} />}
        className={currentMode === 'bible' ? classes.selected : ''}
      />
      <BottomNavigationAction
        label={<span className={classes.label}>真理</span>}
        value="truth"
        icon={<img src="truth.png" alt="" style={{ height: 32 }} />}
        className={currentMode === 'truth' ? classes.selected : ''}
      />
      <BottomNavigationAction
        label={<span className={classes.label}>ヘブル語</span>}
        value="hebrew"
        icon={<img src="shalom.png" alt="" style={{ height: 32 }} />}
        className={currentMode === 'hebrew' ? classes.selected : ''}
      />
    </BottomNavigation>
  );
};

export default Navigation;
