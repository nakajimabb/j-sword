import React, { useState, useContext } from 'react';
import {
  AppBar,
  Box,
  Checkbox,
  Dialog,
  DialogContent,
  Grid,
  Tab,
  Tabs,
  Table,
  TableCell,
  TableBody,
  TableRow,
  Typography,
  makeStyles,
} from '@material-ui/core';
import clsx from 'clsx';

import { canons } from './sword/Canon';
import canon_jp from './sword/canons/locale/ja.json';
import Sword from './sword/Sword';
import AppContext from './AppContext';
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
  gridOt: {
    boxShadow: '1px 1px 1px 1px rgba(0, 0, 0, .5)',
    userSelect: 'none',
    backgroundColor: 'aliceblue',
    lineHeight: 1,
    textAlign: 'center',
    '&:hover': {
      opacity: 0.8,
    },
  },
  gridNt: {
    boxShadow: '1px 1px 1px 1px rgba(0, 0, 0, .5)',
    userSelect: 'none',
    backgroundColor: 'ivory',
    lineHeight: 1,
    textAlign: 'center',
    '&:hover': {
      opacity: 0.8,
    },
  },
  gridChapter: {
    boxShadow: '1px 1px 1px 1px rgba(0, 0, 0, .5)',
    userSelect: 'none',
    backgroundColor: 'white',
    '&:hover': {
      opacity: 0.8,
    },
    width: '10%',
    maxWidth: '10%',
  },
  title: {
    marginBottom: 10,
  },
  check: {
    width: '3%',
  },
  name: {
    width: '67%',
  },
  modtype: {
    width: '10%',
  },
  lang: {
    width: '20%',
  },
  table: {
    padding: 5,
  },
  cell: {
    padding: 5,
  },
  bible: { color: 'darkorange' },
  dictionary: { color: 'darkcyan' },
  morphology: { color: 'royalblue' },
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

interface SwordSelectorProps {
  open: boolean;
  onClose: () => void;
}

const SwordSelector: React.FC<SwordSelectorProps> = ({ open, onClose }) => {
  const canon = canons.nrsv;
  const [tab, setTab] = useState(0);
  const [maxChapter, setMaxChapter] = useState<number>(canon.ot[0].maxChapter);
  const {
    bibles,
    dictionaries,
    morphologies,
    target,
    saveSetting,
  } = useContext(AppContext);
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;
  const classes = useStyles();
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

  const bookChanged = (book: string, maxChap: number) => () => {
    saveSetting({ ...target, book, chapter: '' });
    setMaxChapter(maxChap);
    setTab(2);
  };

  const checkTarget = (modname: string) => () => {
    let modnames = target.modnames;
    if (target.modnames.includes(modname))
      modnames = target.modnames.filter((name) => name !== modname);
    else modnames.push(modname);
    saveSetting({
      ...target,
      modnames: modnames,
    });
  };

  const sortModules = (modules: { [key: string]: Sword }) => {
    const compStr = (str1: string, str2: string) => {
      if (str1 < str2) return -1;
      if (str1 > str2) return 1;
      return 0;
    };

    const compModule = (m1: Sword, m2: Sword) => {
      const comp1 = compStr(m1.lang, m2.lang);
      if (comp1 === 0) {
        return compStr(m1.modname, m2.modname);
      } else {
        return comp1;
      }
    };

    return Object.values(modules).sort((m1, m2) => compModule(m1, m2));
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
      <DialogContent style={{ minHeight: 450 }}>
        <AppBar position="static">
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            aria-label="simple tabs example"
          >
            <Tab label="モジュール" />
            <Tab label="書物" />
            <Tab label="章" />
          </Tabs>
        </AppBar>
        <TabPanel value={tab} index={0}>
          <Table size="small" className={classes.table}>
            <colgroup>
              <col className={classes.check} />
              <col className={classes.name} />
              <col className={classes.lang} />
              <col className={classes.modtype} />
            </colgroup>
            <TableBody>
              {[bibles, dictionaries, morphologies].map((modules) => {
                return sortModules(modules).map((module, index) => (
                  <TableRow key={index}>
                    <TableCell className={classes.cell} style={{ padding: 0 }}>
                      <Checkbox
                        size="small"
                        value={module.modname}
                        checked={
                          module.modtype !== 'bible' ||
                          target.modnames.includes(module.modname)
                        }
                        onChange={checkTarget(module.modname)}
                      />
                    </TableCell>
                    <TableCell className={classes.cell}>
                      {module.title}
                    </TableCell>
                    <TableCell className={classes.cell}>
                      <small>{langs[module.lang]}</small>
                    </TableCell>
                    <TableCell
                      className={clsx(
                        classes.cell,
                        module.modtype && classes[module.modtype]
                      )}
                    >
                      <small>
                        {module.modtype && modtypes[module.modtype]}
                      </small>
                    </TableCell>
                  </TableRow>
                ));
              })}
            </TableBody>
          </Table>
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <Grid container spacing={1}>
            {canon.ot.map((info, index) => (
              <Grid
                key={index}
                item
                xs={2}
                onClick={bookChanged(info.abbrev, info.maxChapter)}
                className={classes.gridOt}
              >
                {canonjp[info.abbrev].abbrev}
                <br />
                <small>{info.abbrev}</small>
              </Grid>
            ))}
            {canon.nt.map((info, index) => (
              <Grid
                key={index}
                item
                xs={2}
                onClick={bookChanged(info.abbrev, info.maxChapter)}
                className={classes.gridNt}
              >
                {canonjp[info.abbrev].abbrev}
                <br />
                <small>{info.abbrev}</small>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <Grid container spacing={1}>
            {[...Array(maxChapter)]
              .map((_, i) => i + 1)
              .map((chapter, index) => (
                <Grid
                  key={index}
                  item
                  onClick={() => {
                    saveSetting({
                      ...target,
                      chapter: String(chapter),
                      verse: '',
                    });
                    onClose();
                  }}
                  className={classes.gridChapter}
                >
                  {chapter}
                </Grid>
              ))}
          </Grid>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default SwordSelector;
