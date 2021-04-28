import React, { useState, useContext, useEffect } from 'react';
import { Dropdown, Icon } from './components';

import AppContext from './AppContext';
import FrameView from './FrameView';
import BibleView from './BibleView';
import DictView from './DictView';

type Props = {
  name: string;
  col: number;
  row: number;
  type: 'book' | 'dictionary' | 'article';
};

const SwordView: React.FC<Props> = ({ name, type, col, row, children }) => {
  const { bibles, layout, setLayout } = useContext(AppContext);
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
    setLayout(
      [
        ...layout.slice(0, col),
        [...layout[col].slice(0, row), ...layout[col].slice(row + 1)],
        ...layout.slice(col + 1),
      ].filter((arr) => arr.length > 0)
    );
  };

  return (
    <FrameView
      title={title}
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
