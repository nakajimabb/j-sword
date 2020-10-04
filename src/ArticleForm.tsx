import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  Grid,
  Paper,
  TextField,
  makeStyles,
} from '@material-ui/core';

import firebase from './firebase';
import 'firebase/firestore';
import 'firebase/auth';
import AppContext from './AppContext';
import { Article } from './types';
import './passage.css';

const useStyles = makeStyles((theme) => ({
  button: {
    marginRight: 5,
    textAlign: 'right',
  },
  title: {
    paddingBottom: 10,
  },
  paper: {
    padding: '20px 40px',
  },
}));

interface ArticleFormProps {
  subject: string;
  body: string;
  heading: string;
  path: string;
  onClose: () => void;
}

const ArticleForm: React.FC<ArticleFormProps> = ({
  subject = '',
  body = '',
  heading = '',
  path,
  onClose,
}) => {
  const [article, setArticle] = useState<Article>({
    subject,
    body,
    heading,
  });
  const { currentUser, customClaims } = useContext(AppContext);
  const admin = customClaims?.admin;
  const classes = useStyles();
  const db = firebase.firestore();

  useEffect(() => {
    if (path && admin) {
      db.doc(path)
        .get()
        .then((snapshot) => {
          const data = snapshot.data() as Article;
          if (data) setArticle(data);
          else resetArticle();
        })
        .catch(() => {
          resetArticle();
        });
    } else {
      resetArticle();
    }
  }, [path]);

  const resetArticle = () => {
    setArticle({ subject: '', body: '', heading: '' });
  };

  const changeArticle = (
    e: React.ChangeEvent<{ name: string; value: string }>
  ) => {
    setArticle({ ...article, [e.target.name]: e.target.value });
  };

  const saveArticle = async () => {
    if (admin && currentUser) {
      try {
        if (path) {
          await db.doc(path).update({
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
    <Box m={5}>
      <Container maxWidth="md">
        <Grid
          container
          direction="row"
          justify="space-between"
          alignItems="center"
          className={classes.title}
        >
          <Grid item></Grid>
          <Grid item>
            <Button
              color="inherit"
              variant="contained"
              size="small"
              onClick={onClose}
              className={classes.button}
            >
              ｷｬﾝｾﾙ
            </Button>
            <Button
              color="primary"
              variant="contained"
              size="small"
              onClick={saveArticle}
              className={classes.button}
            >
              保存
            </Button>
          </Grid>
        </Grid>
        <Paper className={classes.paper}>
          <FormControl fullWidth margin="none" size="small">
            <TextField
              label="タイトル"
              name="subject"
              value={article.subject}
              onChange={changeArticle}
            />
          </FormControl>
          <FormControl fullWidth margin="none" size="small">
            <TextField
              label="見出し"
              name="heading"
              value={article.heading}
              multiline
              rows={4}
              onChange={changeArticle}
            />
          </FormControl>
          <FormControl fullWidth margin="none" size="small">
            <TextField
              label="本文"
              name="body"
              value={article.body}
              multiline
              rows={20}
              onChange={changeArticle}
            />
          </FormControl>
        </Paper>
      </Container>
    </Box>
  );
};

export default ArticleForm;
