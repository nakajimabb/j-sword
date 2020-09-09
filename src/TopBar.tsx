import React, { useState, useRef, useContext } from 'react';
import {
  AppBar,
  Button,
  IconButton,
  Grid,
  Menu,
  MenuItem,
  Toolbar,
  makeStyles,
  fade,
} from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import { LogIn, LogOut, User } from 'react-feather';
import { Link } from 'react-router-dom';

import AppContext from './AppContext';
import SelectTarget from './SelectTarget';
import Sword from './sword/Sword';
import canon_jp from './sword/canons/locale/ja.json';
import firebase from './firebase';
import 'firebase/auth';
import 'firebase/functions';
import './App.css';

const useStyles = makeStyles((theme) => ({
  appbar: {
    backgroundColor: 'black',
    backgroundSize: 'auto 48px',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundImage: 'url("sword.png")',
  },
  chip: {
    backgroundColor: fade(theme.palette.common.white, 1.0),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.8),
    },
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
  icon: {
    color: 'white',
  },
  hide: {
    display: 'none',
  },
}));

interface TopBarProps {}

const TopBar: React.FC<TopBarProps> = () => {
  const bible_file = useRef<HTMLInputElement>(null);
  const dict_file = useRef<HTMLInputElement>(null);
  const morph_file = useRef<HTMLInputElement>(null);
  const references = useRef<HTMLInputElement>(null);
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [open_select_target, setOpenSelectTarget] = useState<boolean>(false);
  const { bibles, target, currentUser, customClaims, currentMode } = useContext(
    AppContext
  );
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;
  const bookName = canonjp.hasOwnProperty(target.book)
    ? canonjp[target.book].abbrev
    : target.book;
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

  const loadFile = (f: React.RefObject<HTMLInputElement>) => () => {
    if (f && f.current) {
      f.current.click();
      setAnchorEl(null);
    }
  };

  const loadReferences = () => {
    if (references && references.current) references.current.click();
  };

  const createReferences = async () => {
    const modkey = window.prompt('modkey');
    if (modkey) {
      const references = await bibles[modkey].createReference();
      console.log({ references });

      let blob = new Blob([JSON.stringify(references)], {
        type: 'application/json',
      });
      let link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${modkey}.json`;
      link.click();
    }
  };

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

  const showUserInfo = () => {
    if (currentUser) {
      let messages: string[] = [];
      if (currentUser.email) messages.push('email: ' + currentUser.email);
      if (currentUser.phoneNumber)
        messages.push('phoneNumber: ' + currentUser.phoneNumber);
      if (currentUser.displayName)
        messages.push('displayName: ' + currentUser.displayName);
      alert(messages.join('\n'));
    }
  };

  const getUsers = () => {
    if (currentUser) {
      const func = firebase
        .app()
        .functions('asia-northeast1')
        .httpsCallable('getAuthUserList');
      func()
        .then((result) => {
          console.log({ result });
          alert('データを取得しました。');
        })
        .catch((error) => {
          console.log({ error });
          alert(error.message || 'エラーが発生しました。');
        });
    }
  };

  return (
    <AppBar position="static" className={classes.appbar}>
      <Toolbar variant="dense">
        <Grid
          container
          direction="row"
          justify="space-between"
          alignItems="center"
        >
          <Grid item>
            {currentMode === 'bible' && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setOpenSelectTarget(true)}
                className={classes.chip}
              >
                {`${bookName} ${target.chapter}章`}
              </Button>
            )}
          </Grid>
          <Grid item>
            {currentUser && (
              <IconButton
                aria-label="profile"
                onClick={showUserInfo}
                className={classes.icon}
              >
                <User fontSize="small" />
              </IconButton>
            )}
            {currentUser ? (
              <IconButton
                aria-label="logout"
                onClick={logoout}
                className={classes.icon}
              >
                <LogOut fontSize="small" />
              </IconButton>
            ) : (
              <Link to="/sign_in">
                <IconButton aria-label="login" className={classes.icon}>
                  <LogIn id="login" fontSize="small" />
                </IconButton>
              </Link>
            )}
            <SelectTarget
              open={open_select_target}
              onClose={() => setOpenSelectTarget(false)}
            />
            {currentUser && (
              <>
                <IconButton
                  aria-label="display more actions"
                  edge="end"
                  color="inherit"
                  onClick={(e: React.MouseEvent) =>
                    setAnchorEl(e.currentTarget)
                  }
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
                  <MenuItem onClick={loadFile(dict_file)}>
                    load dictionary
                  </MenuItem>
                  <MenuItem onClick={loadFile(morph_file)}>
                    load morphology
                  </MenuItem>
                  <MenuItem onClick={loadReferences}>load references</MenuItem>
                  {customClaims.admin && (
                    <MenuItem onClick={getUsers}>get users</MenuItem>
                  )}
                  <MenuItem onClick={createReferences}>create indexes</MenuItem>
                </Menu>
              </>
            )}
          </Grid>
        </Grid>
      </Toolbar>
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
    </AppBar>
  );
};

export default TopBar;
