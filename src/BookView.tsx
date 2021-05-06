import React, { useEffect, useState, useContext } from 'react';
import firebase from './firebase';
import 'firebase/firestore';
import clsx from 'clsx';

import { Button, Flex, Icon, Tabs } from './components';
import AppContext from './AppContext';
import FrameView from './FrameView';
import ArticleForm from './ArticleForm';
import ArticlePreview from './ArticlePreview';
import { Article, Layout, Book } from './types';

type SidebarProps = {
  open: boolean;
  layout: Layout;
  changeArticleId: (id: string | undefined) => void;
  onClose: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  open,
  layout,
  changeArticleId,
  onClose,
}) => {
  const { books, customClaims } = useContext(AppContext);
  if (!books) return null;

  const modname = layout.modname;
  const book = books[modname];
  const admin = customClaims?.role === 'admin';
  const headings = admin
    ? book.headings
    : book.headings.filter((heading) => heading.published);

  return (
    <div className={clsx('', !open && 'hidden')}>
      {/* Background overlay */}
      <div
        className="fixed inset-0 z-20"
        aria-hidden="true"
        onClick={onClose}
      ></div>
      <div className="absolute w-52 h-full top-0 left-0 z-20 bg-white">
        {headings.map((heading, index) => (
          <p
            key={index}
            className="m-1 cursor-pointer"
            onClick={() => changeArticleId(heading.id)}
          >
            {heading.item} {heading.title}
          </p>
        ))}
      </div>
    </div>
  );
};

type Props = {
  bookId: string;
  defaultId?: string;
  layout: Layout;
  col: number;
  row: number;
  className?: string;
};

const BookView: React.FC<Props> = ({ bookId, defaultId, layout, col, row }) => {
  const [tab, setTab] = useState('show');
  const [articleId, setArticleId] = useState<string | undefined>(defaultId);
  const [openLeftMenu, setOpenLeftMenu] = useState(false);
  const [article, setArticle] = useState<Article>({
    title: '',
    content: '',
    published: false,
  });
  const [modified, setModified] = useState(false);
  const { books, loadBooks, customClaims } = useContext(AppContext);
  const modname = layout.modname;
  const book = books ? books[modname] : null;
  const title = book?.title;
  const admin = customClaims?.role === 'admin';
  const dropdowns = admin
    ? [{ title: '記事を追加', onClick: () => changeArticleId(undefined) }]
    : [];

  const changeArticleId = async (id: string | undefined) => {
    if (id) {
      const db = firebase.firestore();
      const doc = await db
        .collection('books')
        .doc(bookId)
        .collection('articles')
        .doc(id)
        .get();
      setArticleId(id);
      setArticle(doc.data() as Article);
      setModified(false);
    } else {
      setArticleId(undefined);
      setArticle({
        title: '',
        content: '',
        published: false,
      });
      setModified(false);
    }
  };

  const changeArticle = (doc: Article) => {
    setArticle(doc);
    setModified(true);
  };

  useEffect(() => {
    const f1 = (bk: Book | null) => {
      if (articleId) {
        changeArticleId(articleId);
      } else if (!articleId && bk && bk.headings.length > 0) {
        changeArticleId(bk.headings[0].id);
      }
    };
    const f2 = async () => {
      if (!books) {
        const bks = await loadBooks(false);
        const bk = bks ? bks[modname] : null;
        f1(bk);
      } else {
        f1(book);
      }
    };
    f2();
  }, [bookId]);

  const updateBookHeading = async (id: string, article: Article) => {
    if (bookId && book) {
      try {
        const headings = book.headings;
        const index = headings.findIndex((heading) => heading.id === id);
        const item = [article.part, article.chapter, article.section]
          .filter((n) => n !== undefined)
          .join('.');
        const heading = {
          id,
          item,
          title: article.title,
          published: article.published,
        };
        if (index >= 0) {
          headings[index] = heading;
        } else {
          headings.push(heading);
        }
        const db = firebase.firestore();
        // 社員情報保存
        await db.collection('books').doc(bookId).update({
          headings,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.log({ error });
        alert(error.message || 'エラーが発生しました。');
      }
    }
  };

  const onSave = async () => {
    try {
      const db = firebase.firestore();
      // 社員情報保存
      if (articleId) {
        await db
          .collection('books')
          .doc(bookId)
          .collection('articles')
          .doc(articleId)
          .update({
            ...article,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        updateBookHeading(articleId, article);
      } else {
        const result = await db
          .collection('books')
          .doc(bookId)
          .collection('articles')
          .add({
            ...article,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        setArticleId(result.id);
        updateBookHeading(result.id, article);
      }
      setModified(false);
    } catch (error) {
      console.log({ error });
      alert(error.message || 'エラーが発生しました。');
    }
  };

  return (
    <FrameView>
      <FrameView.Nav
        title={title ? title : ''}
        col={col}
        row={row}
        leftMenu={
          <span onClick={() => setOpenLeftMenu((prev) => !prev)}>
            <Icon name="view-list" className="w-4 h-4 mr-2 cursor-pointer" />
          </span>
        }
        dropdowns={dropdowns}
      />
      <FrameView.Body col={col} row={row}>
        <div className="relative h-full">
          <Sidebar
            open={openLeftMenu}
            layout={layout}
            changeArticleId={changeArticleId}
            onClose={() => setOpenLeftMenu(false)}
          />
          {admin ? (
            <>
              <Flex justify_content="between" className="border-b">
                <Tabs
                  value={tab}
                  variant="line"
                  size="sm"
                  onChange={(v) => setTab(v)}
                  className="mx-2"
                >
                  <Tabs.Tab
                    label="Preview"
                    icon={<Icon name="photograph" />}
                    value="show"
                  />
                  <Tabs.Tab
                    label={`HTML${modified ? '*' : ''}`}
                    icon={<Icon name="pencil-alt" />}
                    value="edit"
                  />
                </Tabs>
                {tab === 'edit' && (
                  <Button
                    color="primary"
                    size="xs"
                    onClick={onSave}
                    className="mx-2 my-1"
                  >
                    保存
                  </Button>
                )}
              </Flex>
              {tab === 'edit' && (
                <ArticleForm article={article} changeArticle={changeArticle} />
              )}
              {tab === 'show' && <ArticlePreview article={article} />}
            </>
          ) : (
            <ArticlePreview article={article} />
          )}
        </div>
      </FrameView.Body>
    </FrameView>
  );
};

export default BookView;
