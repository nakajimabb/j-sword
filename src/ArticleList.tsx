import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Container,
  Grid,
  makeStyles,
} from '@material-ui/core';

import { Article } from './types';
import AppContext from './AppContext';
import ArticlePage from './ArticlePage';
import firebase from './firebase';
import 'firebase/auth';
import 'firebase/firestore';
import './App.css';
import './passage.css';

const useStyles = makeStyles((theme) => ({
  box: {
    paddingTop: 20,
    paddingBottom: 56,
    overflow: 'scroll',
  },
  card: {
    marginTop: 10,
    marginBottom: 10,
    paddingBottom: 5,
    height: 400,
    boxShadow: '3px 3px 3px 3px rgba(0, 0, 0, .2)',
    '&:hover': {
      opacity: 0.7,
      cursor: 'pointer',
    },
  },
  thumbnail: {
    height: 200,
    maxHeight: 400,
  },
}));

const LIMIT = 10;

const ArticleList: React.FC = () => {
  const [articles, setArticles] = useState<Map<string, Article>>(
    new Map<string, Article>()
  );
  const [targetPath, setTargetPath] = useState<string>('');
  const { customClaims } = useContext(AppContext);
  const admin = customClaims?.admin;
  const classes = useStyles();

  useEffect(() => {
    const f = async () => {
      const db = firebase.firestore();
      const storage = firebase.storage();

      let query = db.collectionGroup('articles');
      if (!admin) query = query.where('published', '==', true);
      query = query.orderBy('createdAt', 'asc').limit(LIMIT);
      const snapshot = await query.get();

      const new_articles: Map<string, Article> = new Map<string, Article>();
      snapshot.forEach(async (doc) => {
        const data = doc.data();
        if (data) {
          const new_article = data as Article;
          const imageRef = storage.refFromURL(data.image);
          new_article.imageUrl = await imageRef.getDownloadURL();
          const thumbnailRef = storage.refFromURL(data.thumbnail);
          new_article.thumbnailUrl = await thumbnailRef.getDownloadURL();
          new_articles.set(doc.ref.path, new_article);
        }
      });
      setArticles(new_articles);
    };
    f();
  }, [admin]);

  if (targetPath)
    return <ArticlePage path={targetPath} onClose={() => setTargetPath('')} />;

  return (
    <Box className={classes.box}>
      <Container maxWidth="lg">
        {admin && (
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
              onClick={() => {
                setTargetPath('');
              }}
            >
              記事を投稿する
            </Button>
          </Grid>
        )}
        <Grid container spacing={3}>
          {Array.from(articles.entries()).map(([path, article], index) => {
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card
                  className={classes.card}
                  onClick={() => setTargetPath(path)}
                >
                  <CardActions>
                    <div
                      dangerouslySetInnerHTML={{ __html: article.subject }}
                    />
                  </CardActions>
                  <CardMedia
                    component="img"
                    image={article.thumbnailUrl}
                    title="thumbnail"
                    className={classes.thumbnail}
                  />
                  <CardContent>
                    <div
                      dangerouslySetInnerHTML={{ __html: article.heading }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

export default ArticleList;
