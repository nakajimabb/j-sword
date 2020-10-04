import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Paper,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { Edit } from '@material-ui/icons';

import firebase from './firebase';
import 'firebase/firestore';
import 'firebase/auth';
import AppContext from './AppContext';
import ArticleForm from './ArticleForm';
import { Article } from './types';
import './passage.css';

const useStyles = makeStyles((theme) => ({
  button: {
    textAlign: 'right',
  },
  title: {
    paddingBottom: 10,
  },
  subject: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
  paper: {
    padding: '20px 40px',
  },
  save: {
    padding: 0,
    margin: 2,
  },
}));

interface ArticlePageProps {
  onClose: () => void;
  path: string;
}

const ArticlePage: React.FC<ArticlePageProps> = ({ onClose, path }) => {
  const [article, setArticle] = useState<Article>({
    subject: '',
    body: '',
    heading: '',
  });
  const [editMode, setEditMode] = useState<boolean>(false);
  const { customClaims } = useContext(AppContext);
  const admin = customClaims?.admin;
  const classes = useStyles();
  const db = firebase.firestore();

  useEffect(() => {
    try {
      if (path) {
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
    } catch (error) {
      console.log({ error });
      alert(error.message || 'エラーが発生しました。');
    }
  }, [path]);

  const resetArticle = () => {
    setArticle({ subject: '', body: '', heading: '' });
  };

  if (editMode) {
    return (
      <ArticleForm
        subject={article.subject}
        body={article.body}
        heading={article.heading}
        path={path}
        onClose={onClose}
      />
    );
  }

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
            <Typography
              component="h3"
              variant="inherit"
              align="center"
              className={classes.title}
            >
              <span dangerouslySetInnerHTML={{ __html: article.subject }} />
              {admin && (
                <>
                  &emsp;
                  <IconButton
                    aria-label="edit"
                    size="small"
                    onClick={() => setEditMode(true)}
                  >
                    <Edit />
                  </IconButton>
                </>
              )}
            </Typography>
          </Grid>
          <Grid item>
            <Button
              color="primary"
              variant="outlined"
              size="small"
              onClick={onClose}
              className={classes.button}
            >
              一覧に戻る
            </Button>
          </Grid>
        </Grid>
        <Paper className={classes.paper}>
          <div dangerouslySetInnerHTML={{ __html: article.body }} />
        </Paper>
      </Container>
    </Box>
  );
};

export default ArticlePage;
