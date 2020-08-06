import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  makeStyles,
} from '@material-ui/core';

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
  const [articles, setArticles] = useState<Article[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const { currentUser, customClaims } = useContext(AppContext);
  const classes = useStyles();
  console.log({ articles });

  useEffect(() => {
    firebase
      .firestore()
      .collectionGroup('articles')
      // .orderBy('updatedAt', 'desc')
      .get()
      .then((snapshot) => {
        let new_articles: Article[] = [];
        snapshot.forEach((doc) => new_articles.push(doc.data() as Article));
        setArticles(new_articles);
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
              onClick={() => setOpen(true)}
            >
              記事を投稿する
            </Button>
          </Grid>
        )}
        <ArticleDialog open={open} onClose={() => setOpen(false)} />
        {articles.map((doc) => {
          return (
            <Card className={classes.card}>
              <CardContent>
                <Typography>{doc.subject}</Typography>
                <div dangerouslySetInnerHTML={{ __html: doc.body }} />
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Container>
  );
};

export default ArticleList;
