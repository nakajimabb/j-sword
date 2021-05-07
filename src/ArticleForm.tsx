import React from 'react';
import clsx from 'clsx';

import { Flex, Form } from './components';
import { Article } from './types';
import { str } from './tools';

type Props = {
  article: Article;
  changeArticle: (doc: Article) => void;
  className?: string;
};

const ArticleForm: React.FC<Props> = ({
  article,
  changeArticle,
  className,
}) => {
  return (
    <Form
      className={clsx('p-3', className)}
      style={{ height: 'calc(100% - 40px)' }}
    >
      <Flex direction="col" className="space-y-2">
        <Form.Text
          value={article.title}
          placeholder="タイトル"
          onChange={(e) => changeArticle({ ...article, title: e.target.value })}
        />
        <Flex className="space-x-2">
          <Form.Number
            value={str(article.part)}
            placeholder="部"
            onChange={(e) =>
              changeArticle({ ...article, part: +e.target.value })
            }
            className="w-1/6"
          />
          <Form.Number
            value={str(article.chapter)}
            placeholder="章"
            onChange={(e) =>
              changeArticle({ ...article, chapter: +e.target.value })
            }
            className="w-1/6"
          />
          <Form.Number
            value={str(article.section)}
            placeholder="節"
            onChange={(e) =>
              changeArticle({ ...article, section: +e.target.value })
            }
            className="w-1/6"
          />
          <Form.Checkbox
            checked={article.published}
            id="checkbox"
            size="md"
            label="公開する"
            onChange={(e) =>
              changeArticle({ ...article, published: e.target.checked })
            }
            className="my-2"
          />
        </Flex>
        <Form.TextArea
          value={article.content}
          placeholder="本文"
          onChange={(e) =>
            changeArticle({ ...article, content: e.target.value })
          }
          style={{ height: 'calc(100vh - 220px)' }}
        />
      </Flex>
    </Form>
  );
};

export default ArticleForm;
