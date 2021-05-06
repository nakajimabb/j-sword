import React, { useContext } from 'react';
import clsx from 'clsx';

import { Grid } from './components';

import AppContext from './AppContext';
import BibleView from './BibleView';
import BookView from './BookView';
import DictView from './DictView';
import './App.css';

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
        {layouts.map((layouts_col, index1) => (
          <Grid
            key={index1}
            cols={1}
            rows={layouts_col.length}
            gap="0"
            flow="col"
            className={clsx(selectLayout && 'relative')}
          >
            {layouts_col.map((layout, index2) => (
              <React.Fragment key={index2}>
                {layout.type === 'bible' && (
                  <BibleView
                    modname={layout.modname}
                    col={index1}
                    row={index2}
                  />
                )}
                {layout.type === 'book' && (
                  <BookView
                    bookId={layout.modname}
                    layout={layout}
                    col={index1}
                    row={index2}
                  />
                )}
                {layout.type === 'dictionary' && (
                  <DictView
                    depth={0}
                    layout={layout}
                    col={index1}
                    row={index2}
                  />
                )}
              </React.Fragment>
            ))}
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default GridLayout;
