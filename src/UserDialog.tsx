import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Grid,
  FormControl,
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

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
}

interface User {
  nickname: string;
  sex: 'male' | 'female' | '';
}

const UserDialog: React.FC<UserDialogProps> = ({ open, onClose }) => {
  const [user, setUser] = useState<User>({ nickname: '', sex: '' });
  const { currentUser } = useContext(AppContext);
  const classes = useStyles();

  useEffect(() => {
    const f = async () => {
      if (currentUser) {
        const u = await firebase
          .firestore()
          .doc(`users/${currentUser.uid}`)
          .get();
        const value = u.data();
        setUser({ ...user, nickname: value?.nickname, sex: value?.sex });
        console.log({ user: value });
      } else {
        setUser({ nickname: '', sex: '' });
      }
    };
    f();
  }, [currentUser]);

  const userSave = async () => {
    try {
      if (currentUser) {
        await firebase
          .firestore()
          .doc(`users/${currentUser.uid}`)
          .set(
            {
              ...user,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        onClose();
      }
    } catch (error) {
      alert('エラーが発生しました。');
      console.log({ error });
    }
  };

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
        <form>
          <FormControl margin="normal" fullWidth>
            <TextField label="Email" value={currentUser?.email} />
          </FormControl>
          <FormControl margin="normal" fullWidth>
            <TextField
              label="ニックネーム"
              value={user.nickname}
              onChange={(e) => setUser({ ...user, nickname: e.target.value })}
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel htmlFor="sex">性別</InputLabel>
            <Select
              value={user.sex}
              onChange={(e) => {
                if (e.target.value === 'male' || e.target.value === 'female')
                  setUser({ ...user, sex: e.target.value });
              }}
              inputProps={{
                name: 'sex',
              }}
              fullWidth
            >
              <MenuItem value={'male'}>男性</MenuItem>
              <MenuItem value={'female'}>女性</MenuItem>
            </Select>
          </FormControl>
          <Grid
            container
            direction="column"
            justify="space-around"
            alignItems="stretch"
          >
            <Button variant="contained" color="primary" onClick={userSave}>
              保存
            </Button>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserDialog;
