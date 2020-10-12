import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from 'react';
import {
  AppBar,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  makeStyles,
  fade,
} from '@material-ui/core';
import {
  MoreVert,
  MenuBookOutlined,
  CloudDownloadOutlined,
} from '@material-ui/icons';
import { LogIn, LogOut } from 'react-feather';
import { Link } from 'react-router-dom';
import firebase from './firebase';
import 'firebase/auth';
import 'firebase/functions';
import clsx from 'clsx';

import Alert from './Alert';
import AppContext from './AppContext';
import SwordInstaller from './SwordInstaller';
import SelectTarget from './SelectTarget';
import Sword from './sword/Sword';
import canon_jp from './sword/canons/locale/ja.json';
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
    marginRight: 10,
    backgroundColor: fade(theme.palette.common.white, 1.0),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.8),
    },
  },
  hide: {
    display: 'none',
  },
  blink: {
    animation: '$flash 1s linear infinite',
  },
  '@keyframes flash': {
    from: {
      opacity: 1,
    },
    to: {
      opacity: 0.5,
    },
  },
}));

interface TopBarProps {}

const TopBar: React.FC<TopBarProps> = () => {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [opener, setOpener] = useState<'installer' | 'selector' | null>(null);
  const [message, setMessage] = useState<string>('');
  const { bibles, target, currentUser, customClaims, currentMode } = useContext(
    AppContext
  );
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;
  const bookName = canonjp.hasOwnProperty(target.book)
    ? canonjp[target.book].abbrev
    : target.book;
  const emptyBibles = Object.keys(bibles).length === 0;
  const emptyTarget = target.mod_keys.length === 0;
  const bible_file = useRef<HTMLInputElement>(null);
  const dict_file = useRef<HTMLInputElement>(null);
  const morph_file = useRef<HTMLInputElement>(null);
  const references = useRef<HTMLInputElement>(null);
  const classes = useStyles();

  const checkMessage = useCallback(() => {
    setMessage('');
    if (emptyBibles) {
      setMessage('モジュールをダウンロードしてください。');
    } else if (emptyTarget) {
      setMessage('聖書を開いてください。');
    }
  }, [emptyBibles, emptyTarget]);

  useEffect(() => {
    checkMessage();
  }, [checkMessage]);

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

  const logout = () => {
    if (window.confirm('ログアウトしますか？')) {
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
              <>
                <Tooltip title="モジュール ダウンロード" aria-label="download">
                  <IconButton
                    size="small"
                    onClick={() => setOpener('installer')}
                    className={clsx(classes.icon, emptyBibles && classes.blink)}
                  >
                    <CloudDownloadOutlined />
                  </IconButton>
                </Tooltip>
                <Tooltip title="聖書を開く" aria-label="open bible">
                  <IconButton
                    size="small"
                    onClick={() => setOpener('selector')}
                    className={clsx(
                      classes.icon,
                      !emptyBibles && emptyTarget && classes.blink
                    )}
                  >
                    <MenuBookOutlined />
                  </IconButton>
                </Tooltip>
                <Typography
                  display="inline"
                  variant="subtitle2"
                >{`${bookName} ${target.chapter}章`}</Typography>
              </>
            )}
          </Grid>
          <Grid item>
            {currentUser?.displayName && (
              <Typography
                display="inline"
                variant="subtitle2"
                style={{ marginRight: 12 }}
              >
                {currentUser.displayName}
              </Typography>
            )}
            {currentUser ? (
              <Tooltip title="ログアウト" aria-label="logout">
                <IconButton
                  size="small"
                  aria-label="logout"
                  onClick={logout}
                  className={classes.icon}
                >
                  <LogOut fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Link to="/sign_in">
                <Tooltip title="ログイン" aria-label="login">
                  <IconButton
                    size="small"
                    aria-label="login"
                    className={classes.icon}
                  >
                    <LogIn id="login" fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Link>
            )}
            <SwordInstaller
              open={opener === 'installer'}
              onClose={() => setOpener(null)}
            />
            <SelectTarget
              open={opener === 'selector'}
              onClose={() => setOpener(null)}
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
      {message && !opener && (
        <Alert message={message} vertical="top" severity="warning" />
      )}
    </AppBar>
  );
};

export default TopBar;
