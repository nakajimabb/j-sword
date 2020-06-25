import React, { useState, useContext } from 'react';
import {
  AppBar,
  Box,
  Checkbox,
  Dialog,
  DialogContent,
  FormControlLabel,
  FormGroup,
  Grid,
  Tab,
  Tabs,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { canons } from './sword/Canon';
import canon_jp from './sword/canons/locale/ja.json';
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
  gridOt: {
    boxShadow: '1px 1px 1px 1px rgba(0, 0, 0, .5)',
    userSelect: 'none',
    backgroundColor: 'aliceblue',
    '&:hover': {
      opacity: 0.8,
    },
  },
  gridNt: {
    boxShadow: '1px 1px 1px 1px rgba(0, 0, 0, .5)',
    userSelect: 'none',
    backgroundColor: 'ivory',
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

interface SelectBookProps {
  open: boolean;
  onClose: () => void;
}

interface User {
  nickname: string | null;
  sex: 'male' | 'female' | null;
}

const SelectBook: React.FC<SelectBookProps> = ({ open, onClose }) => {
  const canon = canons.nrsv;
  const [tab, setTab] = useState(0);
  const [maxChapter, setMaxChapter] = useState<number>(canon.ot[0].maxChapter);
  const { bibles, target, setTarget } = useContext(AppContext);
  const canonjp: { [key: string]: { abbrev: string; name: string } } = canon_jp;
  const classes = useStyles();

  const bookChanged = (book: string, maxChap: number) => () => {
    setTarget({ ...target, book });
    setMaxChapter(maxChap);
    setTab(2);
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
          <FormGroup row>
            {Object.keys(bibles).map((modname, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    name={modname}
                    checked={target.mod_keys.includes(modname)}
                    onChange={(e) => {
                      let modnames = target.mod_keys;
                      console.log({ e, modname, modnames });
                      if (target.mod_keys.includes(modname))
                        modnames = target.mod_keys.filter(
                          (name) => name !== modname
                        );
                      else modnames.push(modname);
                      console.log({ e, modname, modnames });
                      setTarget({
                        ...target,
                        mod_keys: modnames,
                      });
                    }}
                  />
                }
                label={modname}
              />
            ))}
          </FormGroup>
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <Grid container spacing={1}>
            {canon.ot.map((info) => (
              <Grid
                item
                xs={2}
                onClick={bookChanged(info.abbrev, info.maxChapter)}
                className={classes.gridOt}
              >
                {canonjp.hasOwnProperty(info.abbrev)
                  ? canonjp[info.abbrev].abbrev
                  : info.abbrev}
              </Grid>
            ))}
            {canon.nt.map((info) => (
              <Grid
                item
                xs={2}
                onClick={bookChanged(info.abbrev, info.maxChapter)}
                className={classes.gridNt}
              >
                {canonjp.hasOwnProperty(info.abbrev)
                  ? canonjp[info.abbrev].abbrev
                  : info.abbrev}
              </Grid>
            ))}
          </Grid>
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <Grid container spacing={1}>
            {[...Array(maxChapter)]
              .map((_, i) => i + 1)
              .map((chapter) => (
                <Grid
                  item
                  onClick={() => {
                    setTarget({
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

export default SelectBook;
