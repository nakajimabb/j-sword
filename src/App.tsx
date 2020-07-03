import React, { useState, useRef, useContext } from 'react';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Typography,
  Toolbar,
  makeStyles,
  fade,
} from '@material-ui/core';
import { MoreVert, LibraryBooks } from '@material-ui/icons';
import { LogIn, LogOut, User, Book } from 'react-feather';
import clsx from 'clsx';

import AppContext from './AppContext';
import SwordRenderer from './SwordRenderer';
import Annotate from './Annotate';
import UserDialog from './UserDialog';
import ArticleDialog from './ArticleDialog';
import AuthDialog from './AuthDialog';
import SelectTarget from './SelectTarget';
import Sword from './sword/Sword';
import canon_jp from './sword/canons/locale/ja.json';
import firebase from './firebase';
import 'firebase/auth';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import './App.css';
import './passage.css';

const useStyles = makeStyles((theme) => ({
  chip: {
    backgroundColor: fade(theme.palette.common.white, 1.0),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.8),
    },
  },
  container: {
    display: 'flex',
  },
  select: {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 1.0),
  },
  logo: {
    width: 40,
    minWidth: 40,
    height: 40,
    margin: 6,
    padding: 0,
    fontFamily: 'Tinos',
    fontWeight: 'bold',
    fontSize: 32,
    backgroundColor: fade(theme.palette.common.white, 1.0),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.8),
    },
  },
  title: {
    marginLeft: theme.spacing(2),
    flexGrow: 1,
    textAlign: 'left',
  },
  text_field: {
    width: 70,
    marginLeft: 10,
    fontSize: 24,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 1.0),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.8),
    },
  },
  pane: {
    overflow: 'scroll',
    padding: theme.spacing(2),
    textAlign: 'left',
    width: '100%',
    height: 'calc(100vh - 90px)',
    dislay: 'flex',
    flexDirection: 'column',
  },
  hide: {
    display: 'none',
  },
}));

function App() {
  const bible_file = useRef<HTMLInputElement>(null);
  const dict_file = useRef<HTMLInputElement>(null);
  const morph_file = useRef<HTMLInputElement>(null);
  const references = useRef<HTMLInputElement>(null);
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [open_select_target, setOpenSelectTarget] = useState<boolean>(false);
  const [open_user_dialog, setOpenUserDialog] = useState<boolean>(false);
  const [open_article_dialog, setOpenArticleDialog] = useState<boolean>(false);
  const [startAuth, setStartAuth] = useState<boolean>(false);
  const { bibles, target, setTarget, annotate, currentUser } = useContext(
    AppContext
  );
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;
  const bookName = canonjp.hasOwnProperty(target.book)
    ? canonjp[target.book].abbrev
    : target.book;
  const enable_annotate =
    (!!target.book && !!target.chapter && !!annotate.content) ||
    annotate.attributes.length > 0;
  // const enableCreateReferences = false;
  const classes = useStyles();

  const onChangeBibleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target && e.target.files) {
        const files = Array.from(e.target.files);
        for (const file of files) {
          const m = file.name.match(/^(.+)\.\w+$/);
          const fileName = m && m[1] ? m[1] : 'dummy';
          await Sword.install(file, 'bible', fileName);
        }
      }
    } catch (error) {
      alert(error);
    }
  };

  const onChangeDictFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target && e.target.files) {
        const files = Array.from(e.target.files);
        for (const file of files) {
          const m = file.name.match(/^(.+)\.\w+$/);
          const fileName = m && m[1] ? m[1] : 'dummy';
          await Sword.install(file, 'dictionary', fileName);
        }
      }
    } catch (error) {
      alert(error);
    }
  };

  const onChangeMorphFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target && e.target.files) {
        const files = Array.from(e.target.files);
        for (const file of files) {
          const m = file.name.match(/^(.+)\.\w+$/);
          const fileName = m && m[1] ? m[1] : 'dummy';
          await Sword.install(file, 'morphology', fileName);
        }
      }
    } catch (error) {
      alert(error);
    }
  };

  const onChangeReferences = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target && e.target.files) {
        const files = Array.from(e.target.files);
        for (const file of files) {
          const name = file.name;
          const m = name.match(/(\w+)./);
          if (m && m[0] && m[1] && bibles[m[1]]) {
            await bibles[m[1]].installReference(file);
          }
        }
      }
    } catch (error) {
      alert(error);
    }
  };

  const onChangeTarget = async (
    e: React.ChangeEvent<{ name?: string; value: unknown }>
  ) => {
    if (e.target.name) {
      const new_target = { ...target, [e.target.name]: e.target.value };
      setTarget(new_target);
    }
  };

  const loadFile = (f: React.RefObject<HTMLInputElement>) => () => {
    if (f && f.current) {
      f.current.click();
      setAnchorEl(null);
    }
  };

  const loadReferences = () => {
    if (references && references.current) references.current.click();
  };

  // const createReferences = (moduleKey: string) => async () => {
  //   const module = bibles[moduleKey];
  //   const count_lemma = await module.createReferences();

  //   let blob = new Blob([JSON.stringify(count_lemma)], {
  //     type: "application/json",
  //   });
  //   let link = document.createElement("a");
  //   link.href = URL.createObjectURL(blob);
  //   link.download = `${moduleKey}.json`;
  //   link.click();
  // };

  const logoout = () => {
    firebase
      .auth()
      .signOut()
      .then(function () {
        // Sign-out successful.
      })
      .catch(function (error) {
        // An error happened.
        alert('エラーが発生しました。');
        console.log({ error });
      });
  };

  const login = () => {
    firebase.auth().languageCode = 'jp';
    const ui = new firebaseui.auth.AuthUI(firebase.auth());
    var uiConfig = {
      callbacks: {
        signInSuccess: function () {
          // サインイン成功時のコールバック関数
          // 戻り値で自動的にリダイレクトするかどうかを指定
          setStartAuth(false);
          return true;
        },
        uiShown: function () {
          // FirebaseUIウィジェット描画完了時のコールバック関数
        },
      },
      signInFlow: 'redirect',
      signInSuccessUrl: '.',
      signInOptions: [
        // サポートするプロバイダを指定
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      ],
      // Terms of service url.(サービス利用規約ページの)
      //アカウント選択を行う画面の防止
      // credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    };

    // FirebaseUI描画開始
    ui.start('#firebaseui-auth-container', uiConfig);
    setStartAuth(true);
  };

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar variant="dense">
          <Button variant="outlined" color="primary" className={classes.logo}>
            <span style={{ margin: '-14px 0' }}>J</span>
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setOpenSelectTarget(true)}
            className={classes.chip}
          >
            {`${bookName} ${target.chapter}章`}
          </Button>
          <Typography variant="h6" className={classes.title}></Typography>
          {currentUser && (
            <IconButton
              aria-label="profile"
              onClick={() => setOpenUserDialog(true)}
            >
              <User fontSize="small" />
            </IconButton>
          )}
          {currentUser && (
            <IconButton
              aria-label="articles"
              onClick={() => setOpenArticleDialog(true)}
            >
              <LibraryBooks fontSize="small" />
            </IconButton>
          )}
          {currentUser ? (
            <IconButton aria-label="logout" onClick={logoout}>
              <LogOut fontSize="small" />
            </IconButton>
          ) : (
            <IconButton aria-label="login" onClick={login}>
              <LogIn id="login" fontSize="small" />
            </IconButton>
          )}
          <SelectTarget
            open={open_select_target}
            onClose={() => setOpenSelectTarget(false)}
          />
          {open_user_dialog && (
            <UserDialog open={true} onClose={() => setOpenUserDialog(false)} />
          )}
          {open_article_dialog && (
            <ArticleDialog
              open={true}
              onClose={() => setOpenArticleDialog(false)}
            />
          )}
          <IconButton
            aria-label="display more actions"
            edge="end"
            color="inherit"
            onClick={(e: React.MouseEvent) => setAnchorEl(e.currentTarget)}
          >
            <MoreVert />
          </IconButton>
          <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={loadFile(bible_file)}>load bible</MenuItem>
            <MenuItem onClick={loadFile(dict_file)}>load dictionary</MenuItem>
            <MenuItem onClick={loadFile(morph_file)}>load morphology</MenuItem>
            <MenuItem onClick={loadReferences}>load references</MenuItem>
            {/* {enableCreateReferences && (
              <>
                <MenuItem onClick={createReferences("WHNU")}>
                  create dictionary references from WHNU
                </MenuItem>
                <MenuItem onClick={createReferences("Byz")}>
                  create dictionary references from Byz
                </MenuItem>
                <MenuItem onClick={createReferences("LXX")}>
                  create dictionary references from LXX
                </MenuItem>
                <MenuItem onClick={createReferences("OSHB")}>
                  create dictionary references from OSHB
                </MenuItem>
              </>
            )} */}
          </Menu>
        </Toolbar>
      </AppBar>
      <input
        type="file"
        id="bible_file"
        name="bible_file"
        ref={bible_file}
        multiple={true}
        style={{ display: 'none' }}
        onChange={onChangeBibleFile}
      />
      <input
        type="file"
        id="dict_file"
        name="dict_file"
        ref={dict_file}
        multiple={true}
        style={{ display: 'none' }}
        onChange={onChangeDictFile}
      />
      <input
        type="file"
        id="morph_file"
        name="morph_file"
        ref={morph_file}
        multiple={true}
        style={{ display: 'none' }}
        onChange={onChangeMorphFile}
      />
      <input
        type="file"
        id="references"
        name="references"
        ref={references}
        multiple={true}
        style={{ display: 'none' }}
        onChange={onChangeReferences}
      />
      <div className={classes.container}>
        <Grid
          id="firebaseui-auth-container"
          container
          spacing={0}
          direction="column"
          alignItems="center"
          justify="center"
          className={clsx(!startAuth && classes.hide)}
          style={{
            minHeight: '100vh',
            backgroundColor: '#fafafa',
          }}
        ></Grid>
        {!startAuth &&
          target.mod_keys.map((mod_key: string, index: number) => (
            <SwordRenderer key={index} mod_key={mod_key} />
          ))}
        {!startAuth && enable_annotate && (
          <Box className={classes.pane}>
            <Annotate annotate={annotate} />
          </Box>
        )}
      </div>
    </div>
  );
}

export default App;
