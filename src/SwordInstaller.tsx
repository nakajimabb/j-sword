import React, { useState, useEffect, useContext } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { Delete } from '@material-ui/icons';
import firebase from './firebase';
import 'firebase/firestore';
import 'firebase/storage';

import Sword from './sword/Sword';
import AppContext from './AppContext';
import LinearProgressWithLabel from './LinearProgressWithLabel';
import { Module } from './types';
import './passage.css';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
  },
  dialog: {
    height: '100%',
    width: '100%',
    maxWidth: 'initial',
    backgroundColor: 'whitesmoke',
  },
  button: {
    padding: 0,
    margin: 2,
  },
  title: {
    marginBottom: 10,
  },
  check: {
    width: '7%',
  },
  name: {
    width: '60%',
  },
  modtype: {
    width: '10%',
  },
  lang: {
    width: '16%',
  },
  action: {
    width: '7%',
  },
  table: {
    padding: 5,
  },
  cell: {
    padding: 5,
  },
  paper: {
    backgroundColor: 'white',
    padding: '0 20px',
    marginTop: 10,
    marginBottom: 10,
  },
  paper2: {
    backgroundColor: 'snow',
    padding: '5px 20px',
    marginTop: 10,
    marginBottom: 10,
  },
  alert: {
    color: 'red',
  },
}));

interface SwordInstallerProps {
  open: boolean;
  onClose: () => void;
}

const SwordInstaller: React.FC<SwordInstallerProps> = ({ open, onClose }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [modules, setModules] = useState<Module[]>([]);
  const [targets, setTargets] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<string[]>([]);
  const {
    currentUser,
    customClaims,
    bibles,
    dictionaries,
    morphologies,
    loadModules,
  } = useContext(AppContext);
  const langs: { [key: string]: string } = {
    ja: '日本語',
    he: 'ヘブル語',
    grc: 'ギリシャ語',
    en: '英語',
  };
  const modtypes: { [key: string]: string } = {
    bible: '聖書',
    dictionary: '辞書',
    morphology: '語形',
  };
  const installed_names = new Set(
    Object.keys(bibles).concat(
      Object.keys(dictionaries),
      Object.keys(morphologies)
    )
  );
  const classes = useStyles();

  useEffect(() => {
    const f = async () => {
      const db = firebase.firestore();
      const role = customClaims?.role;
      const admin = role === 'admin';
      const manager = role === 'manager';
      try {
        const new_modules: Module[] = [];
        const querySnap = await db
          .collection('modules')
          .orderBy('modtype')
          .orderBy('lang')
          .get();
        querySnap.forEach((doc) => {
          const module = doc.data() as Module;
          const authorized =
            module.secrecy === 'public' ||
            (module.secrecy === 'protected' && currentUser) ||
            (module.secrecy === 'internal' && (manager || admin)) ||
            (module.secrecy === 'private' && admin);
          console.log({ role, secrecy: module.secrecy });
          if (authorized) {
            new_modules.push(module);
          }
        });
        setModules(new_modules);
      } catch (error) {
        console.log({ error });
        alert(error.message);
      }
    };
    f();
  }, [currentUser, customClaims]);

  const addTarget = (module: Module) => (
    e: React.ChangeEvent<{ value: unknown; checked: unknown }>
  ) => {
    let new_targets = Array.from(targets);
    if (e.target.checked) {
      new_targets.push(module.modname);
      if (module.dependencies)
        new_targets = new_targets.concat(module.dependencies);
    } else {
      new_targets = new_targets.filter((modname) => modname !== module.modname);
    }
    new_targets = new_targets.filter(
      (modname) => !installed_names.has(modname)
    );
    setTargets(new Set(new_targets));
  };

  const deleteTarget = (module: Module) => async () => {
    try {
      setLoading(true);
      const bible = bibles[module.modname];
      if (bible) bible.remove();
      const dictionary = dictionaries[module.modname];
      if (dictionary) dictionary.remove();
      const morphology = morphologies[module.modname];
      if (morphology) morphology.remove();
      await loadModules();
      setLoading(false);
    } catch (error) {
      console.log({ error });
      alert(error.message);
      setLoading(false);
    }
  };

  const blobFromUrl = (url: string) => {
    return new Promise<Blob | null>((resolve, reject) => {
      if (!url) reject(null);
      const storage = firebase.storage();
      var httpsReference = storage.refFromURL(url);
      httpsReference.getDownloadURL().then(function (url2) {
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = async () => {
          resolve(xhr.response);
        };
        xhr.open('GET', url2);
        xhr.send();
      });
    });
  };

  const download = async () => {
    const storage = firebase.storage();
    const target_modules = modules.filter((module) =>
      targets.has(module.modname)
    );
    setLoading(true);
    setProgress(0);
    setMessages([]);
    let count = 0;
    for await (let module of target_modules) {
      try {
        const pathReference = storage.ref(module.path);
        const url = await pathReference.getDownloadURL();
        const blob = await blobFromUrl(url);
        if (blob) {
          await Sword.install(blob, module.modtype, module.title);
          if (module.referencePath) {
            const pathReference2 = storage.ref(module.referencePath);
            const url2 = await pathReference2.getDownloadURL();
            const blob2 = await blobFromUrl(url2);
            const sword = await Sword.load(module.modname);
            if (blob2 && sword) await sword.installReference(blob2);
          }
        }
      } catch (error) {
        console.log({ error });
        setMessages((prev) => prev.concat(error.message));
      }
      count += 1;
      setProgress((100 * count) / target_modules.length);
    }
    setProgress(100);
    await loadModules();
    setTimeout(() => setLoading(false), 500);
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
      <DialogContent style={{ minHeight: 450, backgroundColor: 'whitesmoke' }}>
        <Typography component="h4" variant="inherit" align="center">
          モジュール ダウンロード
        </Typography>
        <Paper className={classes.paper}>
          <Table size="small" className={classes.table}>
            <colgroup>
              <col className={classes.check} />
              <col className={classes.name} />
              <col className={classes.modtype} />
              <col className={classes.lang} />
              <col className={classes.action} />
            </colgroup>
            <TableBody>
              {modules.map((module) => (
                <TableRow>
                  <TableCell className={classes.cell}>
                    <FormControlLabel
                      label=""
                      control={
                        <Checkbox
                          size="small"
                          value={module.modname}
                          disabled={
                            installed_names.has(module.modname) || loading
                          }
                          checked={
                            installed_names.has(module.modname) ||
                            targets.has(module.modname)
                          }
                          onChange={addTarget(module)}
                        />
                      }
                    />
                  </TableCell>
                  <TableCell className={classes.cell}>{module.title}</TableCell>
                  <TableCell className={classes.cell}>
                    <small>{modtypes[module.modtype]}</small>
                  </TableCell>
                  <TableCell className={classes.cell}>
                    <small>{langs[module.lang]}</small>
                  </TableCell>
                  <TableCell className={classes.cell}>
                    {installed_names.has(module.modname) && (
                      <Tooltip title="モジュールを削除">
                        <IconButton
                          size="small"
                          disabled={loading}
                          onClick={deleteTarget(module)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
        {loading && (
          <LinearProgressWithLabel
            variant="determinate"
            value={progress}
            label={`${Math.round(progress)}%`}
          />
        )}
        {messages.length > 0 && (
          <Paper className={classes.paper2}>
            {messages.map((message) => (
              <Typography variant="subtitle2" className={classes.alert}>
                {message}
              </Typography>
            ))}
          </Paper>
        )}
        <Grid container direction="row" justify="center" alignItems="center">
          <Button
            variant="contained"
            color="primary"
            disabled={loading}
            onClick={download}
          >
            ダウンロード
          </Button>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default SwordInstaller;
