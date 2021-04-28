import React, { useContext } from 'react';
import { Button, Dropdown, Icon } from './components';
import AppContext from './AppContext';
import { Layout } from './types';

type Props = {
  col?: number;
  row?: number;
  trigger: React.ReactElement;
};

const BookSelecter: React.FC<Props> = ({ col = -1, row = -1, trigger }) => {
  const {
    bibles,
    target,
    layouts,
    setLayouts,
    setSelectLayout,
    saveSetting,
  } = useContext(AppContext);
  const items = Object.keys(bibles).map((modname) => ({
    modname,
    title: bibles[modname].title,
  }));

  const storeSetting = (layout: Layout) => {
    if (col >= 0 && row >= 0) {
      const newLayouts = [...layouts];
      newLayouts[col][row] = layout;
      setLayouts(newLayouts);
      saveSetting(target, newLayouts);
    } else {
      if (layouts.length > 0) {
        setSelectLayout(layout);
      } else {
        setLayouts([[layout]]);
        saveSetting(target, [[layout]]);
      }
    }
  };

  return (
    <Dropdown icon={trigger} align="right">
      <Dropdown.Item title="聖書">
        {items.map((item) => (
          <Dropdown.Item
            title={item.title}
            onClick={() => storeSetting({ name: item.modname, type: 'book' })}
          />
        ))}
      </Dropdown.Item>
      <Dropdown.Item
        title="辞書"
        onClick={() => storeSetting({ name: '', type: 'dictionary' })}
      />
    </Dropdown>
  );
};

export default BookSelecter;
