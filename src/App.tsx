import React, { useState, useRef, useContext } from 'react';
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Menu,
  MenuItem,
  Select,
  ListItemText,
  Checkbox,
  Typography,
  TextField,
  IconButton,
  FormControl,
  makeStyles,
  fade,
} from '@material-ui/core';
import { MoreVert, LibraryBooks } from '@material-ui/icons';
import { LogIn, LogOut, User } from 'react-feather';
import clsx from 'clsx';

import AppContext from './AppContext';
import SwordRenderer from './SwordRenderer';
import Annotate from './Annotate';
import ArticleDialog from './ArticleDialog';
import AuthDialog from './AuthDialog';
import Sword from './sword/Sword';
import firebase from './firebase';
import 'firebase/auth';
import './App.css';
import './passage.css';

let g_scroll: { id: string | null; time: Date | null } = {
  id: null,
  time: null,
};

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
  },
  select: {
    borderRadius: theme.shape.borderRadius,
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
  formControl: {},
}));

function App() {
  const bible_file = useRef<HTMLInputElement>(null);
  const dict_file = useRef<HTMLInputElement>(null);
  const morph_file = useRef<HTMLInputElement>(null);
  const references = useRef<HTMLInputElement>(null);
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [open_auth_dialog, setOpenAuthDialog] = useState<boolean>(false);
  const { bibles, target, setTarget, annotate, currentUser } = useContext(
    AppContext
  );
  const enable_annotate = !!annotate.content || annotate.attributes.length > 0;
  // const enableCreateReferences = false;
  const classes = useStyles();

  const onChangeBibleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target && e.target.files) {
        const files = Array.from(e.target.files);
        for (const file of files) {
          await Sword.install(file, 'bible');
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
          await Sword.install(file, 'dictionary');
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
          await Sword.install(file, 'morphology');
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
            await bibles[m[1]].installReference(m[1], file);
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

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const now = new Date();
    const target = e.currentTarget;
    if (!g_scroll.id || !g_scroll.time || +now - +g_scroll.time > 100) {
      g_scroll = { id: target.id, time: new Date() };
    }
    if (g_scroll.id && target.id && g_scroll.id === target.id) {
      const scroll_pos =
        target.scrollTop / (target.scrollHeight - target.clientHeight);
      const contents = document.querySelectorAll('.pane');
      contents.forEach((content) => {
        if (content.id !== target.id) {
          content.scrollTop =
            scroll_pos * (content.scrollHeight - content.clientHeight);
        }
      });
      g_scroll = { id: target.id, time: new Date() };
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

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar variant="dense">
          <Button variant="outlined" color="primary" className={classes.logo}>
            <span style={{ margin: '-14px 0' }}>J</span>
          </Button>
          <FormControl
            size="small"
            variant="outlined"
            className={classes.formControl}
          >
            <Select
              name="mod_keys"
              labelId="demo-simple-select-filled-label"
              multiple
              value={target.mod_keys}
              renderValue={(selected: unknown) =>
                selected instanceof Array ? selected.join(', ') : ''
              }
              onChange={onChangeTarget}
              className={classes.select}
              style={{ width: 200 }}
            >
              {Object.keys(bibles).map((mod_key, index) => (
                <MenuItem key={index} value={mod_key}>
                  <Checkbox checked={target.mod_keys.indexOf(mod_key) > -1} />
                  <ListItemText primary={mod_key} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            name="book"
            variant="outlined"
            size="small"
            value={target.book}
            onChange={onChangeTarget}
            className={classes.text_field}
            style={{ width: 100 }}
          />
          <TextField
            name="chapter"
            type="number"
            variant="outlined"
            size="small"
            value={target.chapter}
            onChange={onChangeTarget}
            className={classes.text_field}
          />
          <TextField
            name="verse"
            type="number"
            variant="outlined"
            size="small"
            value={target.verse}
            onChange={onChangeTarget}
            className={classes.text_field}
          />
          <Typography variant="h6" className={classes.title}></Typography>
          {currentUser && (
            <IconButton
              aria-label="profile"
              onClick={() => alert(currentUser?.email)}
            >
              <User fontSize="small" />
            </IconButton>
          )}
          {currentUser ? (
            <IconButton aria-label="logout" onClick={logoout}>
              <LogOut fontSize="small" />
            </IconButton>
          ) : (
            <IconButton
              aria-label="login"
              onClick={() => setOpenAuthDialog(true)}
            >
              <LogIn fontSize="small" />
            </IconButton>
          )}
          <AuthDialog
            open={open_auth_dialog}
            onClose={() => setOpenAuthDialog(false)}
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
            <MenuItem onClick={loadFile(bible_file)}>load module</MenuItem>
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

      <div className={classes.container}>
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
        {target.mod_keys.map((mod_key: string, index: number) => (
          <Box
            key={index}
            id={`pane-${mod_key}`}
            className={clsx('pane', classes.pane)}
            onScroll={onScroll}
          >
            <SwordRenderer key={index} mod_key={mod_key} />
          </Box>
        ))}
        {enable_annotate && (
          <Box className={classes.pane}>
            <Annotate annotate={annotate} />
          </Box>
        )}
      </div>
    </div>
  );
}

export default App;
