import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Breadcrumbs,
  Container,
  Grid,
  IconButton,
  Link,
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
import './article.css';

const useStyles = makeStyles((theme) => ({
  box: {
    paddingTop: 20,
    paddingBottom: 56,
    overflow: 'scroll',
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
  img: {
    width: '100%',
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
  const storage = firebase.storage();

  useEffect(() => {
    const f = async () => {
      try {
        if (path) {
          const snapshot = await db.doc(path).get();
          const data = snapshot.data() as Article;
          if (data.image) {
            const imageRef = storage.refFromURL(data.image);
            data.imageUrl = await imageRef.getDownloadURL();
          }
          if (data) setArticle(data);
        } else {
          resetArticle();
        }
      } catch (error) {
        console.log({ error });
        alert(error.message || 'エラーが発生しました。');
        resetArticle();
      }
    };
    f();
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
    <Box className={classes.box}>
      <Container maxWidth="md">
        <Grid container direction="row" justify="flex-end" alignItems="center">
          <Grid item>
            <Breadcrumbs aria-label="breadcrumb">
              <Typography>真理</Typography>
              <Link color="inherit" href="#" onClick={onClose}>
                一覧
              </Link>
            </Breadcrumbs>
          </Grid>
        </Grid>
        <Paper className={classes.paper}>
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
          <Box mt={1} ml={5} mr={5} mb={2}>
            <img src={article.imageUrl} className={classes.img} />
          </Box>
          <div dangerouslySetInnerHTML={{ __html: article.body }} />
        </Paper>
      </Container>
    </Box>
  );
};

export default ArticlePage;
