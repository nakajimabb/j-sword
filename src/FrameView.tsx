import React, { useContext } from 'react';
import clsx from 'clsx';

import AppContext from './AppContext';
import BookSelecter from './BookSelecter';
import { Flex, Icon, Tooltip } from './components';

const textSizes = [
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',
  'text-5xl',
];

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
  const resize = layouts[col][row].resize;
  const textSize = layouts[col][row].textSize || 0;

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

  const incrementTextSize = (increment: number) => () => {
    const newLayouts = [...layouts];
    let newTextSize = textSize + increment;
    if (newTextSize < 0) newTextSize = 0;
    if (newTextSize >= textSizes.length) newTextSize = textSizes.length - 1;
    newLayouts[col][row].textSize = newTextSize;
    setLayouts(newLayouts);
  };

  const resizeLayout = (resize: 'normal' | 'minimize' | 'double') => () => {
    const newLayouts = [...layouts];
    if (resize === 'double') {
      newLayouts.forEach((layout_cols, c) =>
        layout_cols.forEach((layout, r) => {
          newLayouts[c][r].resize =
            col === c && row === r ? 'double' : 'normal';
        })
      );
    } else {
      newLayouts[col][row].resize = resize;
    }
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
              <Tooltip
                title="文字を小さくする"
                disabled={textSize <= 0}
                className="text-left"
              >
                <span onClick={incrementTextSize(-1)}>
                  <Icon
                    name="zoom-out"
                    variant="outline"
                    className="w-4 h-4 text-gray-500 cursor-pointer ml-1  hover:text-gray-300"
                  />
                </span>
              </Tooltip>
              <Tooltip
                title="文字を大きくする"
                disabled={textSize >= textSizes.length - 1}
                className="text-left"
              >
                <span onClick={incrementTextSize(1)}>
                  <Icon
                    name="zoom-in"
                    variant="outline"
                    className="w-4 h-4 text-gray-500 cursor-pointer ml-1  hover:text-gray-300"
                  />
                </span>
              </Tooltip>
              <Tooltip
                title={resize !== 'double' ? '画面を拡げる' : '画面を戻す'}
                className="text-left"
              >
                <span
                  onClick={resizeLayout(
                    resize !== 'double' ? 'double' : 'normal'
                  )}
                >
                  <Icon
                    name={
                      resize !== 'double' ? 'arrows-expand' : 'arrows-reduce'
                    }
                    variant="outline"
                    className="w-4 h-4 text-gray-500 cursor-pointer ml-1  hover:text-gray-300"
                  />
                </span>
              </Tooltip>
              <span
                onClick={resizeLayout(
                  resize !== 'minimize' ? 'minimize' : 'normal'
                )}
              >
                <Icon
                  name={resize !== 'minimize' ? 'minus-circle' : 'plus-circle'}
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
  const { selectLayout, layouts } = useContext(AppContext);
  const layout = layouts[col][row];
  const textSize =
    0 <= layout.textSize && layout.textSize < textSizes.length
      ? textSizes[layout.textSize]
      : textSizes[0];

  return (
    <div className="w-full h-full pt-6">
      <div
        id={id}
        className={clsx(
          'w-full h-full overflow-x-auto overflow-y-scroll',
          textSize,
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
