import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { Edit, Delete } from '@material-ui/icons';

import { Article } from './types';
import AppContext from './AppContext';
import ArticleDialog from './ArticleDialog';
import firebase from './firebase';
import 'firebase/auth';
import 'firebase/firestore';
import './App.css';
import './passage.css';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
  },
  card: {
    marginTop: 10,
    marginBottom: 10,
    paddingBottom: 5,
  },
}));

const ArticleList: React.FC = () => {
  const [articles, setArticles] = useState<
    firebase.firestore.QueryDocumentSnapshot[]
  >([]);
  const [target, setTarget] = useState<{
    action: 'new' | 'edit' | null;
    snapshot: firebase.firestore.QueryDocumentSnapshot | null;
  }>({ action: null, snapshot: null });
  const { customClaims } = useContext(AppContext);
  const classes = useStyles();

  useEffect(() => {
    firebase
      .firestore()
      .collectionGroup('articles')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        setArticles(snapshot.docs);
      });
  }, []);

  return (
    <Container maxWidth="lg">
      <Box m={2}>
        {customClaims.admin && (
          <Grid
            container
            direction="column-reverse"
            justify="space-evenly"
            alignItems="flex-end"
          >
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => setTarget({ action: 'new', snapshot: null })}
            >
              記事を投稿する
            </Button>
          </Grid>
        )}
        <ArticleDialog
          open={!!target.action}
          snapshot={target.snapshot}
          onClose={() => setTarget({ ...target, action: null })}
        />
        {articles.map((snapshot) => {
          const article = snapshot.data() as Article;
          return (
            <Card className={classes.card}>
              <CardContent>
                <Grid
                  container
                  direction="row"
                  justify="space-between"
                  alignItems="center"
                >
                  <Grid item>
                    <b>{article.subject}</b>
                  </Grid>
                  <Grid item>
                    {customClaims.admin && (
                      <>
                        <IconButton
                          color="primary"
                          onClick={() =>
                            setTarget({ action: 'edit', snapshot })
                          }
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="primary"
                          onClick={() => snapshot.ref.delete()}
                        >
                          <Delete />
                        </IconButton>
                      </>
                    )}
                  </Grid>
                </Grid>
                <div dangerouslySetInnerHTML={{ __html: article.body }} />
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Container>
  );
};

export default ArticleList;
