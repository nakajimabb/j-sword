import React, { useContext } from 'react';
import clsx from 'clsx';

import AppContext from './AppContext';
import BookSelecter from './BookSelecter';
import { Flex, Dropdown, Icon } from './components';

type SelectionProps = {
  col: number;
  row?: number;
  position: 'top' | 'bottom' | 'left' | 'right';
};

const Selection: React.FC<SelectionProps> = ({ col, row, position }) => {
  const {
    targetHistory,
    layouts,
    setLayouts,
    selectLayout,
    setSelectLayout,
    saveSetting,
  } = useContext(AppContext);

  // ビューを追加
  const AddTarget = () => {
    if (selectLayout) {
      if (row !== undefined) {
        const newLayout = [
          ...layouts.slice(0, col),
          [
            ...layouts[col].slice(0, row),
            selectLayout,
            ...layouts[col].slice(row),
          ],
          ...layouts.slice(col + 1),
        ];
        setLayouts(newLayout);
        saveSetting(targetHistory.history, newLayout);
      } else {
        const newLayout = [
          ...layouts.slice(0, col),
          [selectLayout],
          ...layouts.slice(col),
        ];
        setLayouts(newLayout);
        saveSetting(targetHistory.history, newLayout);
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
        position === 'left' && 'top-0 left-0 h-screen w-24 z-10',
        position === 'right' && 'top-0 right-0 h-screen w-24 z-10'
      )}
    ></div>
  );
};

type NavProps = {
  title: string;
  col: number;
  row: number;
  leftMenu?: React.ReactElement;
  dropdowns?: { title: string; onClick: () => void }[];
};

const Nav: React.FC<NavProps> = ({ title, col, row, leftMenu, dropdowns }) => {
  const { targetHistory, layouts, setLayouts, saveSetting } = useContext(
    AppContext
  );

  const onClose = (col: number, row: number) => () => {
    const newLayout = [
      ...layouts.slice(0, col),
      [...layouts[col].slice(0, row), ...layouts[col].slice(row + 1)],
      ...layouts.slice(col + 1),
    ].filter((arr) => arr.length > 0);
    setLayouts(newLayout);
    saveSetting(targetHistory.history, newLayout);
  };

  return (
    <nav className="w-full h-6 px-2 absolute shadow top-0 bg-yellow-100">
      <Flex justify_content="between" align_items="center" className="h-full">
        <Flex align_items="center">
          {leftMenu}
          <BookSelecter
            col={col}
            row={row}
            trigger={<small className="cursor-pointer">{title}</small>}
          />
        </Flex>
        <Dropdown
          icon={<Icon name="menu-alt-1" className="w-4 h-4 cursor-pointer" />}
          align="right"
        >
          {dropdowns &&
            dropdowns.map((dropdown, index) => (
              <Dropdown.Item
                key={index}
                title={dropdown.title}
                onClick={dropdown.onClick}
              />
            ))}
          <Dropdown.Item title="閉じる" onClick={onClose(col, row)} />
        </Dropdown>
      </Flex>
    </nav>
  );
};

type BodyProps = {
  col: number;
  row: number;
  id?: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  className?: string;
};

const Body: React.FC<BodyProps> = ({
  col,
  row,
  id,
  onScroll,
  className,
  children,
}) => {
  const { selectLayout } = useContext(AppContext);

  return (
    <div className="w-full h-full pt-6">
      <div
        id={id}
        className={clsx(
          'w-full h-full overflow-scroll overflow-x-auto',
          className
        )}
        onScroll={onScroll}
      >
        {children}
        {selectLayout && <Selection col={col} row={row} position="top" />}
        {selectLayout && (
          <Selection col={col} row={row + 1} position="bottom" />
        )}
        {selectLayout && row === 0 && <Selection col={col} position="left" />}
        {selectLayout && row === 0 && (
          <Selection col={col + 1} position="right" />
        )}
      </div>
    </div>
  );
};

type FrameViewType = React.FC & {
  Nav: typeof Nav;
  Body: typeof Body;
};

const FrameView: FrameViewType = ({ children }) => {
  return <div className="relative">{children}</div>;
};
FrameView.Nav = Nav;
FrameView.Body = Body;

export default FrameView;
