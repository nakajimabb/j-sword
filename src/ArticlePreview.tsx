import React, { useEffect, useContext } from 'react';

import AppContext from './AppContext';
import { Article } from './types';

type Props = {
  article: Article;
  className?: string;
};

const ArticlePreview: React.FC<Props> = ({ article, className }) => {
  const { targetWords, setTargetWords, layouts, setTarget } = useContext(
    AppContext
  );

  const changeTargetWords = (e: Event) => {
    const target = e.target as Element;
    const lemma = target.getAttribute('data-lemma');
    if (target && lemma) {
      const lang = lemma[0] === 'H' ? 'he' : 'grc';
      const word = {
        ...targetWords[0],
        lemma,
        morph: '',
        text: '',
        targetLemma: '',
        fixed: false,
        lang,
      };
      setTargetWords([word, ...targetWords.slice(1)]);
    }
  };

  const changeBibleTarget = (e: Event) => {
    const target = e.target as Element;
    const pos = target.getAttribute('data-bible');
    if (target && pos) {
      const m = pos.match(/^(\w+).(\d+)(:([\d-,]+))*$/);
      if (m) {
        const newTarget = {
          book: m[1],
          chapter: String(+m[2]),
          verse: m[4],
        };
        setTarget(newTarget);
      }
    }
  };

  useEffect(() => {
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
  }, [article]);

  useEffect(() => {
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
  }, [article]);

  const item = [article.part, article.chapter, article.section]
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
