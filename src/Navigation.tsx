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
        label="Bible"
        value="bible"
        icon={<img src="volume.png" alt="" style={{ height: 32 }} />}
      />
      <BottomNavigationAction
        label="Truth"
        value="truth"
        icon={<img src="truth.png" alt="" style={{ height: 32 }} />}
      />
      <BottomNavigationAction
        label="Kirishitan"
        value="kirishitan"
        disabled
        icon={<img src="cross.png" alt="" style={{ height: 32 }} />}
      />
      <BottomNavigationAction
        label="Worship"
        value="worship"
        disabled
        icon={<img src="holyspilit.png" alt="" style={{ height: 32 }} />}
      />
      <BottomNavigationAction
        label="Ministry"
        value="ministry"
        disabled
        icon={<img src="candle.png" alt="" style={{ height: 32 }} />}
      />
    </BottomNavigation>
  );
};

export default Navigation;
