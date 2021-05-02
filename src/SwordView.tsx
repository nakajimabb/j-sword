import React, { useState, useContext, useEffect } from 'react';
import { Dropdown, Icon } from './components';

import { Layout } from './types';
import AppContext from './AppContext';
import FrameView from './FrameView';
import BibleView from './BibleView';
import DictView from './DictView';
import BookView from './BookView';
import BookSelecter from './BookSelecter';

type Props = {
  col: number;
  row: number;
  layout: Layout;
};

const SwordView: React.FC<Props> = ({ layout, col, row, children }) => {
  const {
    bibles,
    target,
    layouts,
    books,
    loadBooks,
    setLayouts,
    saveSetting,
  } = useContext(AppContext);
  const [title, setTitle] = useState<string>('');
  const modname = layout.modname;

  useEffect(() => {
    if (layout.type === 'bible') {
      if (bibles[modname]) setTitle(bibles[modname].title);
    } else if (layout.type === 'dictionary') {
      setTitle('辞書');
    } else if (layout.type === 'book') {
      if (books && books[modname]) setTitle(books[modname].title);
      else loadBooks(false);
    }
  }, [layout, books, bibles]);

  const onClose = () => {
    const newLayout = [
      ...layouts.slice(0, col),
      [...layouts[col].slice(0, row), ...layouts[col].slice(row + 1)],
      ...layouts.slice(col + 1),
    ].filter((arr) => arr.length > 0);
    setLayouts(newLayout);
    saveSetting(target, newLayout);
  };

  return (
    <FrameView
      title={
        <BookSelecter
          col={col}
          row={row}
          trigger={<span className="cursor-pointer">{title}</span>}
        />
      }
      menu={
        <Dropdown
          icon={<Icon name="menu-alt-1" className="w-4 h-4" />}
          align="right"
        >
          <Dropdown.Item title="閉じる" onClick={() => onClose()} />
        </Dropdown>
      }
    >
      {layout.type === 'bible' && <BibleView mod_key={modname} />}
      {layout.type === 'dictionary' && <DictView depth={0} />}
      {layout.type === 'book' && <BookView docId={layout.modname} />}
      {children}
    </FrameView>
  );
};

export default SwordView;
