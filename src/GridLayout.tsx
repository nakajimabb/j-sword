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
  const { layouts, selectLayout } = useContext(AppContext);
  const layouts_col = layouts[col];

  useEffect(() => {
    const layouts_col = layouts[col];
    if (
      layouts_col.some(
        (layout) => layout.doubled || layout.minimized || layout.disabled
      )
    ) {
      const trows = layouts_col.map((layout) => {
        if (layout.minimized || layout.disabled) return '1.5rem';
        else if (layout.doubled) return '2fr';
        else return '1fr';
      });
      setTemplateRows(trows.join(' '));
    } else {
      setTemplateRows(undefined);
    }
  }, [col, layouts]);

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
            <DictView layout={layout} col={col} row={index2} />
          )}
        </React.Fragment>
      ))}
    </Grid>
  );
};

const GridLayout: React.FC = () => {
  const [templateCols, setTemplateCols] =
    useState<string | undefined>(undefined);
  const { layouts, setSelectLayout } = useContext(AppContext);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.keyCode === 27) {
        setSelectLayout(null);
      }
    };

    window.addEventListener('keydown', esc, false);
    return () => window.removeEventListener('keydown', esc);
  }, [setSelectLayout]);

  useEffect(() => {
    const doubleds = layouts.map((layout_rows) =>
      layout_rows.some((layout) => layout.doubled)
    );
    if (doubleds.some((doubled) => doubled)) {
      const tcols = doubleds.map((doubled) => (doubled ? '2fr' : '1fr'));
      setTemplateCols(tcols.join(' '));
    } else {
      setTemplateCols(undefined);
    }
  }, [layouts]);

  return (
    <div className="pt-12 h-screen">
      <Grid
        cols={`1 md:${layouts.length}`}
        rows={`${layouts.length} md:1`}
        gap="0"
        flow="row"
        template_cols={templateCols}
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
