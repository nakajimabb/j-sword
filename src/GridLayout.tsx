import React, { useContext } from 'react';
import clsx from 'clsx';

import { Grid } from './components';

import AppContext from './AppContext';
import SwordView from './SwordView';
import './App.css';

type SelectionProps = {
  col: number;
  row: number | null;
  position: 'top' | 'bottom' | 'left' | 'right';
};

const Selection: React.FC<SelectionProps> = ({ col, row, position }) => {
  const { layout, setLayout, selectLayout, setSelectLayout } = useContext(
    AppContext
  );

  // ビューを追加
  const AddTarget = () => {
    if (selectLayout) {
      if (row) {
        setLayout([
          ...layout.slice(0, col - 1),
          [
            ...layout[col - 1].slice(0, row - 1),
            selectLayout,
            ...layout[col - 1].slice(row - 1),
          ],
          ...layout.slice(col),
        ]);
      } else {
        setLayout([
          ...layout.slice(0, col - 1),
          [selectLayout],
          ...layout.slice(col - 1),
        ]);
      }
    }
    setSelectLayout(null);
  };

  return (
    <div
      onClick={AddTarget}
      className={clsx(
        'absolute bg-gray-600 opacity-0 hover:opacity-50',
        position === 'top' && 'top-0 left-0 h-24 w-full',
        position === 'bottom' && 'bottom-0 left-0 h-24 w-full',
        position === 'left' && 'top-0 left-0 h-full w-24',
        position === 'right' && 'top-0 right-0 h-full w-24'
      )}
    ></div>
  );
};

type Props = {};

const GridLayout: React.FC<Props> = () => {
  const { layout, selectLayout } = useContext(AppContext);

  return (
    <div className="pt-12 h-screen">
      <Grid
        cols={`1 md:${layout.length}`}
        rows={`${layout.length} md:1`}
        gap="0"
        flow="row"
        className="w-full h-full"
      >
        {layout.map((views, index1) => (
          <Grid
            key={index1}
            cols={1}
            rows={views.length}
            gap="0"
            flow="col"
            className={clsx(selectLayout && 'relative')}
          >
            {views.map((view, index2) => (
              <SwordView
                col={index1}
                row={index2}
                key={index2}
                name={view.name}
                type={view.type}
              >
                {selectLayout && (
                  <Selection col={index1 + 1} row={index2 + 1} position="top" />
                )}
                {selectLayout && (
                  <Selection
                    col={index1 + 1}
                    row={index2 + 2}
                    position="bottom"
                  />
                )}
              </SwordView>
            ))}
            {selectLayout && (
              <Selection col={index1 + 1} row={null} position="left" />
            )}
            {selectLayout && layout.length - 1 === index1 && (
              <Selection col={index1 + 2} row={null} position="right" />
            )}
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default GridLayout;
