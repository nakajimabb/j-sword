import React, { useState, useEffect, useContext } from 'react';
import {
  AppBar,
  Box,
  Dialog,
  DialogContent,
  DialogContentText,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  FormControl,
  Grid,
  IconButton,
  Typography,
  TextField,
  Toolbar,
  makeStyles,
} from '@material-ui/core';
import { Close } from '@material-ui/icons';
import Pagination from '@material-ui/lab/Pagination';
import firebase from './firebase';
import 'firebase/firestore';
import 'firebase/auth';
import AppContext from './AppContext';
import './passage.css';

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
}

interface Article {
  subject: string;
  body: string;
}

const ArticleDialog: React.FC<ArticleDialogProps> = ({ open, onClose }) => {
  const [user, setUser] = useState<firebase.firestore.DocumentReference | null>(
    null
  );
  const [article, setArticle] = useState<Article>({ subject: '', body: '' });
  const [articles, setArticles] = useState<Article[]>([]);
  const { currentUser } = useContext(AppContext);
  const classes = useStyles();

  useEffect(() => {
    const f = async () => {
      if (currentUser) {
        const userRef = await firebase
          .firestore()
          .collection('users')
          .doc(currentUser.uid);
        setUser(userRef);

        const articlesRef = await userRef
          .collection('articles')
          .orderBy('createdAt', 'desc')
          .limit(10)
          .get();
        let new_articles: Article[] = [];
        articlesRef.forEach((doc) => new_articles.push(doc.data() as Article));
        setArticles(new_articles);
      } else {
        setUser(null);
        setArticles([]);
      }
    };
    f();
  }, [currentUser]);

  const createArticle = async () => {
    if (user) {
      await user.collection('articles').add({
        ...article,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      setArticle({ subject: '', body: '' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen className={classes.dialog}>
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
          <TextField
            label="本文"
            value={article.body}
            multiline
            rows={20}
            onChange={(e) => setArticle({ ...article, body: e.target.value })}
          />
        </FormControl>
        <Grid
          container
          direction="column"
          justify="space-around"
          alignItems="flex-end"
        >
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={createArticle}
          >
            投稿
          </Button>
        </Grid>
        <DialogContentText>
          <List className={classes.list}>
            {articles.map((doc) => {
              return (
                <>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={doc.subject}
                      secondary={truncate(doc.body, 100)}
                    />
                  </ListItem>
                  <Divider />
                </>
              );
            })}
          </List>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleDialog;
