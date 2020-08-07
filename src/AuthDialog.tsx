import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Dialog,
  DialogContent,
  Box,
  Grid,
  FormControl,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  makeStyles,
} from '@material-ui/core';
import firebase from './firebase';
import 'firebase/auth';
import './passage.css';

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

interface TabPanelProps {
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ value, index, children }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
};

interface AuthEmailProps {
  onClose: () => void;
}

// メール認証
const AuthEmail: React.FC<AuthEmailProps> = ({ onClose }) => {
  const [account, setAccount] = useState({ email: '', password: '' });

  const login = async () => {
    try {
      const res = await firebase
        .auth()
        .signInWithEmailAndPassword(account.email, account.password);
      if (res?.user?.emailVerified) {
        onClose();
      } else {
        console.log('Email認証未完了');
      }
    } catch (error) {
      alert('エラーが発生しました。');
      console.log(error);
    }
  };

  return (
    <form>
      <FormControl margin="normal" fullWidth>
        <TextField
          id="account"
          value={account.email}
          onChange={(e) => setAccount({ ...account, email: e.target.value })}
          label="Email"
        />
      </FormControl>
      <FormControl margin="normal" required fullWidth>
        <TextField
          id="password"
          value={account.password}
          onChange={(e) => setAccount({ ...account, password: e.target.value })}
          type="password"
          label="パスワード"
        />
      </FormControl>
      <Grid
        container
        direction="column"
        justify="space-around"
        alignItems="stretch"
      >
        <Button variant="contained" color="primary" onClick={login}>
          ログイン
        </Button>
      </Grid>
    </form>
  );
};

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onClose }) => {
  const [tab, setTab] = useState(0);
  const classes = useStyles();

  useEffect(() => {}, []);

  const authGoogle = async () => {
    try {
      onClose();
      setTab(0);
      const provider = new firebase.auth.GoogleAuthProvider();
      await firebase.auth().signInWithPopup(provider);
    } catch (error) {
      alert('エラーが発生しました。');
      console.log(error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth="sm"
      fullWidth
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
    >
      <DialogContent>
        <AppBar position="static">
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            aria-label="simple tabs example"
          >
            <Tab label="メール / パスワード" />
            <Tab label="Google" onClick={authGoogle} />
          </Tabs>
        </AppBar>
        <TabPanel value={tab} index={0}>
          <AuthEmail onClose={onClose} />
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
