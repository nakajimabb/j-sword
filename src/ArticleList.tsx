import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
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
    height: 400,
  },
}));

const LIMIT = 10;

const ArticleList: React.FC = () => {
  const [articles, setArticles] = useState<Map<string, Article>>(
    new Map<string, Article>()
  );
  const [open, setOpen] = useState<boolean>(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const { customClaims } = useContext(AppContext);
  const classes = useStyles();

  useEffect(() => {
    firebase
      .firestore()
      .collectionGroup('articles')
      .orderBy('createdAt', 'desc')
      .limit(LIMIT)
      .onSnapshot((snapshot) => {
        const new_articles: Map<string, Article> = new Map<string, Article>();
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          new_articles.set(doc.ref.id, data as Article);
        });
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
              onClick={() => {
                setTargetId(null);
                setOpen(true);
              }}
            >
              記事を投稿する
            </Button>
          </Grid>
        )}
        <ArticleDialog
          open={open}
          docId={targetId}
          onClose={() => {
            setOpen(false);
            setTargetId(null);
          }}
        />
        <Grid container spacing={3}>
          {Array.from(articles.entries()).map(([docId, article]) => {
            return (
              <Grid item xs={12} sm={6} md={4} lg={3}>
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
                              onClick={() => {
                                setTargetId(docId);
                                setOpen(true);
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </>
                        )}
                      </Grid>
                    </Grid>
                    <div dangerouslySetInnerHTML={{ __html: article.body }} />
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Container>
  );
};

export default ArticleList;
