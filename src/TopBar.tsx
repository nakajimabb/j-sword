import React, { useState, useRef, useContext } from 'react';
import {
  AppBar,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
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
import './App.css';

const useStyles = makeStyles((theme) => ({
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
  const { bibles, target, currentUser } = useContext(AppContext);
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

  const showUserInfo = () => {
    if (currentUser) {
      let messages: string[] = [];
      if (currentUser.email) messages.push('メール: ' + currentUser.email);
      if (currentUser.phoneNumber)
        messages.push('電話番号: ' + currentUser.phoneNumber);
      if (currentUser.displayName)
        messages.push('名前: ' + currentUser.displayName);
      alert(messages.join('\n'));
    }
  };

  return (
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
          <IconButton aria-label="profile" onClick={showUserInfo}>
            <User fontSize="small" />
          </IconButton>
        )}
        {currentUser ? (
          <IconButton aria-label="logout" onClick={logoout}>
            <LogOut fontSize="small" />
          </IconButton>
        ) : (
          <Link to="/sign_in">
            <IconButton aria-label="login">
              <LogIn id="login" fontSize="small" />
            </IconButton>
          </Link>
        )}
        <SelectTarget
          open={open_select_target}
          onClose={() => setOpenSelectTarget(false)}
        />
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
