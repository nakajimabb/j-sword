import React, { useState, useContext, useEffect } from 'react';
import { Dropdown, Icon } from './components';

import AppContext from './AppContext';
import FrameView from './FrameView';
import BibleView from './BibleView';
import DictView from './DictView';
import BookSelecter from './BookSelecter';

type Props = {
  name: string;
  col: number;
  row: number;
  type: 'book' | 'dictionary' | 'article';
};

const SwordView: React.FC<Props> = ({ name, type, col, row, children }) => {
  const { bibles, target, layouts, setLayouts, saveSetting } = useContext(
    AppContext
  );
  const [title, setTitle] = useState<string>('');

  useEffect(() => {
    if (type === 'book') {
      if (bibles[name]) setTitle(bibles[name].title);
    } else if (type === 'dictionary') {
      setTitle('辞書');
    } else {
      setTitle('記事');
    }
  }, [name, type, bibles]);

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
      {type === 'book' ? <BibleView mod_key={name} /> : <DictView depth={0} />}
      {children}
    </FrameView>
  );
};

export default SwordView;
