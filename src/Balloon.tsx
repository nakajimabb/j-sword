import React from 'react';
import { Box, Grid, IconButton, makeStyles } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import clsx from 'clsx';

const useStyles = makeStyles((theme) => ({
  warning: {
    backgroundColor: '#ff9800',
    '&:before': {
      borderRight: '10px solid transparent',
      borderBottom: '15px solid #ff9800',
      borderLeft: '10px solid transparent',
    },
  },
  info: {
    backgroundColor: '#2196f3',
  },
  success: {
    backgroundColor: '#4caf50',
  },
  error: {
    backgroundColor: '#f44336',
  },
  balloon: {
    minWidth: 300,
    display: 'inline-block',
    color: 'white',
    position: 'absolute',
    fontSize: '85%',
    padding: 10,
    backgroundColor: '#2196f3',
    boxShadow:
      '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)',
    borderRadius: 5,
    '&:before': {
      content: "''",
      position: 'absolute',
      left: 20,
      top: -15,
      display: 'white',
      width: 0,
      height: 0,
      borderRight: '10px solid transparent',
      borderBottom: '15px solid #2196f3',
      borderLeft: '10px solid transparent',
    },
  },
}));

interface BalloonProps {
  message: string;
  top?: number;
  left?: number;
  // horizontal?: 'center' | 'left' | 'right';
  // vertical?: 'bottom' | 'top';
  onClose?: () => void;
}

const Balloon: React.FC<BalloonProps> = ({
  message,
  top = 0,
  left = 0,
  // horizontal = 'center',
  // vertical = 'bottom',
  onClose,
}) => {
  const classes = useStyles();

  return (
    <Box className={clsx(classes.balloon)} style={{ top, left: left - 15 }}>
      <Grid
        container
        direction="row"
        justify="space-between"
        alignItems="center"
      >
        <Grid item>{message}</Grid>
        <Grid item>
          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Balloon;
