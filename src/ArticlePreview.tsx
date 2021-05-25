import React, { useEffect, useContext } from 'react';

import AppContext from './AppContext';
import { Article } from './types';

type Props = {
  article: Article;
  className?: string;
};

const ArticlePreview: React.FC<Props> = ({ article, className }) => {
  const { targetWord, setTargetWord, targetHistory, updateTargetHistory } =
    useContext(AppContext);

  useEffect(() => {
    const changeTargetWords = (e: Event) => {
      const target = e.target as Element;
      const lemma = target.getAttribute('data-lemma');
      if (target && lemma) {
        setTargetWord({
          ...targetWord,
          lemma,
          morph: '',
          text: '',
          fixed: false,
        });
      }
    };

    const elems = document.querySelectorAll('.lemma');
    if (elems.length > 0) {
      elems.forEach((elem) =>
        elem.addEventListener('click', changeTargetWords)
      );
      return () => {
        elems.forEach((elem) =>
          elem.removeEventListener('click', changeTargetWords)
        );
      };
    }
  }, [article, targetWord, setTargetWord]);

  useEffect(() => {
    const changeBibleTarget = (e: Event) => {
      const target = e.target as Element;
      const position = target.getAttribute('data-bible');
      if (target && position) {
        if (targetHistory.addHistory(position)) {
          updateTargetHistory(targetHistory.dup(), false);
        }
      }
    };

    const elems = document.querySelectorAll('.bible');
    if (elems.length > 0) {
      elems.forEach((elem) =>
        elem.addEventListener('click', changeBibleTarget)
      );
      return () => {
        elems.forEach((elem) =>
          elem.removeEventListener('click', changeBibleTarget)
        );
      };
    }
  }, [article, targetHistory]);

  const item = [article?.part, article?.chapter, article?.section]
    .filter((n) => n !== undefined)
    .join('.');

  return (
    <div className="w-full h-full p-4">
      <h1 className="font-semibold text-lg">
        {item}&nbsp;{article.title}
      </h1>
      <div
        dangerouslySetInnerHTML={{ __html: article.content }}
        className={className}
      />
    </div>
  );
};

export default ArticlePreview;
