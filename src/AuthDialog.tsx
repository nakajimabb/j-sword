import React, { useState, useEffect, useContext } from 'react';
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
import AppContext from './AppContext';
import './passage.css';
import clsx from 'clsx';

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

const AuthEmail: React.FC<AuthEmailProps> = ({ onClose }) => {
  const [account, setAccount] = useState({ email: '', password: '' });
  const { setCurrentUser } = useContext(AppContext);

  const login = async () => {
    try {
      // メール認証
      const res = await firebase
        .auth()
        .signInWithEmailAndPassword(account.email, account.password);
      //状態チェック
      if (res?.user?.emailVerified) {
        setCurrentUser(firebase.auth().currentUser!);
        onClose();
      } else {
        console.log('Email認証未完了');
      }
    } catch (error) {
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth="xl"
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
            <Tab label="Google" />
            <Tab label="Item Three" />
          </Tabs>
        </AppBar>
        <TabPanel value={tab} index={0}>
          <AuthEmail onClose={onClose} />
        </TabPanel>
        <TabPanel value={tab} index={1}>
          Item Two
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
