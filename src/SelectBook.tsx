import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Grid,
  FormControl,
  FormControlLabel,
  Checkbox,
  FormGroup,
  TextField,
  Button,
  InputLabel,
  Select,
  MenuItem,
  makeStyles,
} from '@material-ui/core';
import firebase from './firebase';
import 'firebase/firestore';
import 'firebase/auth';
import AppContext from './AppContext';
import './passage.css';
import clsx from 'clsx';
import { firestore } from 'firebase';

const str = (text: string | null) => (text ? String(text) : '');

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
  },
  dialog: {
    height: '100%',
    width: '100%',
    maxWidth: 'initial',
  },
  button: {
    padding: 0,
    margin: 2,
  },
  text_area: {
    height: 240,
  },
}));

interface SelectBookProps {
  open: boolean;
  onClose: () => void;
}

interface User {
  nickname: string | null;
  sex: 'male' | 'female' | null;
}

const SelectBook: React.FC<SelectBookProps> = ({ open, onClose }) => {
  const [user, setUser] = useState<User>({ nickname: null, sex: null });
  const { bibles, target, setTarget } = useContext(AppContext);
  const classes = useStyles();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth="xs"
      fullWidth
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
    >
      <DialogContent>
        <FormGroup row>
          {Object.keys(bibles).map((modname, index) => (
            <FormControlLabel
              key={index}
              control={
                <Checkbox
                  name={modname}
                  checked={target.mod_keys.includes(modname)}
                  onChange={(e) => {
                    let modnames = target.mod_keys;
                    console.log({ e, modname, modnames });
                    if (target.mod_keys.includes(modname))
                      modnames = target.mod_keys.filter(
                        (name) => name !== modname
                      );
                    else modnames.push(modname);
                    console.log({ e, modname, modnames });
                    setTarget({
                      ...target,
                      mod_keys: modnames,
                    });
                  }}
                />
              }
              label={modname}
            />
          ))}
        </FormGroup>
      </DialogContent>
    </Dialog>
  );
};

export default SelectBook;
