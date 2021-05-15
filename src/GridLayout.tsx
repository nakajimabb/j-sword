import React, { useState, useContext, useEffect } from 'react';
import clsx from 'clsx';

import { Grid } from './components';

import AppContext from './AppContext';
import BibleView from './BibleView';
import BookView from './BookView';
import DictView from './DictView';
import './App.css';

type Props = {
  col: number;
};

const GridCols: React.FC<Props> = ({ col }) => {
  const [templateRows, setTemplateRows] =
    useState<string | undefined>(undefined);
  const { layouts, selectLayout, setSelectLayout } = useContext(AppContext);
  const layouts_col = layouts[col];

  useEffect(() => {
    document.addEventListener('keydown', esc, false);
    return document.removeEventListener('keydown', esc);
  }, []);

  useEffect(() => {
    if (layouts_col.some((layout) => layout.minimized || layout.disabled)) {
      const trows = layouts_col.map((layout) =>
        layout.minimized || layout.disabled ? '1.5rem' : '1fr'
      );
      setTemplateRows(trows.join(' '));
    } else {
      setTemplateRows(undefined);
    }
  }, [layouts]);

  const esc = (e: KeyboardEvent) => {
    // ESC
    if (e.keyCode === 27) {
      setSelectLayout(null);
    }
  };

  return (
    <Grid
      cols={1}
      rows={layouts_col.length}
      gap="0"
      flow="col"
      template_rows={templateRows}
      className={clsx('h-full', selectLayout && 'relative')}
    >
      {layouts_col.map((layout, index2) => (
        <React.Fragment key={index2}>
          {layout.type === 'bible' && (
            <BibleView modname={layout.modname} col={col} row={index2} />
          )}
          {layout.type === 'book' && (
            <BookView
              bookId={layout.modname}
              layout={layout}
              col={col}
              row={index2}
            />
          )}
          {layout.type === 'dictionary' && (
            <DictView depth={0} layout={layout} col={col} row={index2} />
          )}
        </React.Fragment>
      ))}
    </Grid>
  );
};

const GridLayout: React.FC = () => {
  const { layouts, selectLayout } = useContext(AppContext);

  return (
    <div className="pt-12 h-screen">
      <Grid
        cols={`1 md:${layouts.length}`}
        rows={`${layouts.length} md:1`}
        gap="0"
        flow="row"
        className="w-full h-full"
      >
        {layouts.map((_, index1) => (
          <GridCols key={index1} col={index1} />
        ))}
      </Grid>
    </div>
  );
};

export default GridLayout;
