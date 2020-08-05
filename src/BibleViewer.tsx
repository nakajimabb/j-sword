import React, { useContext } from 'react';
import { Box, makeStyles } from '@material-ui/core';

import AppContext from './AppContext';
import SwordRenderer from './SwordRenderer';
import DictView from './DictView';
import './App.css';
import './passage.css';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
  },
  pane: {
    overflow: 'scroll',
    padding: theme.spacing(2),
    textAlign: 'left',
    width: '100%',
    height: 'calc(100vh - 150px)',
    dislay: 'flex',
    flexDirection: 'column',
  },
  hide: {
    display: 'none',
  },
}));

const BibleViewer: React.FC = () => {
  const { target } = useContext(AppContext);
  const classes = useStyles();

  return (
    <div className={classes.container}>
      {target.mod_keys.map((mod_key: string, index: number) => (
        <SwordRenderer key={index} mod_key={mod_key} />
      ))}
      <Box className={classes.pane}>
        <DictView depth={0} />
      </Box>
    </div>
  );
};

export default BibleViewer;
