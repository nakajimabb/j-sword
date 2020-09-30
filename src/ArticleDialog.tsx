import React, { useState, useEffect, useContext } from 'react';
import {
  AppBar,
  Box,
  Dialog,
  DialogContent,
  Button,
  FormControl,
  Grid,
  IconButton,
  Typography,
  TextField,
  Toolbar,
  makeStyles,
} from '@material-ui/core';
import { Close } from '@material-ui/icons';
import firebase from './firebase';
import 'firebase/firestore';
import 'firebase/auth';
import AppContext from './AppContext';
import './passage.css';

const RichEditor = require('./RichEditor');

const truncate = (str: string, len: number) =>
  str.length <= len ? str : str.substr(0, len) + '...';

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: 'relative',
  },
  list: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
  subject: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
  dialog: {
    height: '100%',
    width: '100%',
    maxWidth: 'initial',
  },
  save: {
    padding: 0,
    margin: 2,
  },
}));

interface ArticleDialogProps {
  open: boolean;
  onClose: () => void;
  docId: string | null;
}

interface Article {
  subject: string;
  body: string;
}

const ArticleDialog: React.FC<ArticleDialogProps> = ({
  open,
  onClose,
  docId,
}) => {
  const [article, setArticle] = useState<Article>({ subject: '', body: '' });
  const { currentUser } = useContext(AppContext);
  const classes = useStyles();
  const db = firebase.firestore();

  useEffect(() => {
    if (docId && currentUser) {
      db.collection('users')
        .doc(currentUser.uid)
        .collection('articles')
        .doc(docId)
        .get()
        .then((snapshot) => {
          const data = snapshot.data() as Article;
          console.log({ docId, data });
          if (data) setArticle(data);
          else resetArticle();
        })
        .catch(() => {
          resetArticle();
        });
    } else {
      resetArticle();
    }
  }, [docId]);

  const resetArticle = () => {
    setArticle({ subject: '', body: '' });
  };

  const saveArticle = async () => {
    if (currentUser) {
      try {
        if (docId) {
          await db
            .collection('users')
            .doc(currentUser.uid)
            .collection('articles')
            .doc(docId)
            .update({
              ...article,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
          onClose();
        } else {
          await db
            .collection('users')
            .doc(currentUser.uid)
            .collection('articles')
            .add({
              ...article,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
          onClose();
        }
      } catch (error) {
        console.log({ error });
        alert(error.message || 'エラーが発生しました。');
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      className={classes.dialog}
    >
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" className={classes.subject}>
            記事一覧
          </Typography>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <Close />
          </IconButton>
        </Toolbar>
      </AppBar>
      <DialogContent>
        <FormControl margin="normal" fullWidth>
          <TextField
            label="タイトル"
            value={article.subject}
            onChange={(e) =>
              setArticle({ ...article, subject: e.target.value })
            }
          />
        </FormControl>
        <FormControl margin="normal" fullWidth>
          <RichEditor.EditorConvertToHTML
            html={article.body}
            setHtml={(html: string) => setArticle({ ...article, body: html })}
          />
        </FormControl>
        <Grid
          container
          direction="column"
          justify="space-around"
          alignItems="flex-end"
        >
          <Button variant="contained" color="primary" onClick={saveArticle}>
            投稿
          </Button>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleDialog;
