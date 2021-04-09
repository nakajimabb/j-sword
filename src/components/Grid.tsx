import React from 'react';
import clsx from 'clsx';
import { makeResponsiveClasses } from './tools';

type GridProps = {
  cols?: string;
  rows?: string;
  gap?: string;
  flow?: 'row' | 'col' | 'row-dense' | 'col-dense';
  auto_cols?: 'auto' | 'min' | 'max' | 'fr';
  auto_rows?: 'auto' | 'min' | 'max' | 'fr';
  className?: string;
};

const Grid: React.FC<GridProps> = ({
  cols,
  rows,
  gap,
  flow,
  auto_cols,
  auto_rows,
  className,
  children,
}) => {
  return (
    <div
      className={clsx(
        'grid',
        cols && makeResponsiveClasses(cols, 'grid-cols'),
        rows && makeResponsiveClasses(rows, 'grid-rows'),
        gap && makeResponsiveClasses(gap, 'gap'),
        flow && `grid-flow-${flow}`,
        auto_cols && `auto-cols-${auto_cols}`,
        auto_rows && `auto-rows-${auto_rows}`,
        className
      )}
    >
      {children}
    </div>
  );
};

export default Grid;
