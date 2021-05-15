import React, { useContext } from 'react';
import clsx from 'clsx';

import AppContext from './AppContext';
import BookSelecter from './BookSelecter';
import { Flex, Icon } from './components';

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
  rightMenu?: React.ReactElement;
};

const Nav: React.FC<NavProps> = ({ title, col, row, leftMenu, rightMenu }) => {
  const { targetHistory, layouts, setLayouts, saveSetting } =
    useContext(AppContext);
  const disabled = layouts[col][row].disabled;
  const minimized = layouts[col][row].minimized;

  const onClose = (col: number, row: number) => () => {
    if (window.confirm('ビューを閉じますか？')) {
      const newLayout = [
        ...layouts.slice(0, col),
        [...layouts[col].slice(0, row), ...layouts[col].slice(row + 1)],
        ...layouts.slice(col + 1),
      ].filter((arr) => arr.length > 0);
      setLayouts(newLayout);
      saveSetting(targetHistory.history, newLayout);
    }
  };

  const minimizeLayout = (minimized: boolean) => () => {
    const newLayouts = [...layouts];
    newLayouts[col][row].minimized = minimized;
    setLayouts(newLayouts);
  };

  return (
    <nav
      className={clsx(
        'w-full h-6 px-2 absolute shadow top-0',
        disabled && 'bg-yellow-50 text-gray-400',
        !disabled && 'bg-yellow-100'
      )}
    >
      <Flex justify_content="between" align_items="center" className="h-full">
        <Flex align_items="center">
          {leftMenu}
          <BookSelecter
            col={col}
            row={row}
            trigger={<small className="cursor-pointer">{title}</small>}
          />
        </Flex>
        <Flex>
          {!disabled && (
            <>
              {rightMenu}
              <span onClick={minimizeLayout(!minimized)}>
                <Icon
                  name={minimized ? 'plus-circle' : 'minus-circle'}
                  variant="solid"
                  className="w-4 h-4 text-gray-500 cursor-pointer ml-1  hover:text-gray-300"
                />
              </span>
              <span onClick={onClose(col, row)}>
                <Icon
                  name="x-circle"
                  variant="solid"
                  className="w-4 h-4 text-gray-500 cursor-pointer ml-1  hover:text-gray-300"
                />
              </span>
            </>
          )}
        </Flex>
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
          'w-full h-full overflow-x-auto overflow-y-scroll',
          className
        )}
        onScroll={onScroll}
      >
        {children}
        {selectLayout && <Selection col={col} row={row} position="top" />}
        {selectLayout && (
          <Selection col={col} row={row + 1} position="bottom" />
        )}
      </div>
    </div>
  );
};

type Props = {
  col: number;
  row: number;
  className?: string;
};

type FrameViewType = React.FC<Props> & {
  Nav: typeof Nav;
  Body: typeof Body;
};

const FrameView: FrameViewType = ({ col, row, className, children }) => {
  const { selectLayout } = useContext(AppContext);
  return (
    <>
      <div className={clsx('relative h-full overflow-hidden', className)}>
        {children}
      </div>
      {selectLayout && row === 0 && <Selection col={col} position="left" />}
      {selectLayout && row === 0 && (
        <Selection col={col + 1} position="right" />
      )}
    </>
  );
};
FrameView.Nav = Nav;
FrameView.Body = Body;

export default FrameView;
