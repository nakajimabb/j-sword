import React, { useContext } from 'react';
import { Button, Dropdown, Icon } from './components';
import AppContext from './AppContext';

type Props = {};

const BookSelecter: React.FC<Props> = () => {
  const { bibles, layout, setLayout, setSelectLayout } = useContext(AppContext);
  const items = Object.keys(bibles).map((modname) => ({
    modname,
    title: bibles[modname].title,
  }));

  return (
    <Dropdown
      icon={
        <Button
          variant="icon"
          size="sm"
          color="none"
          className="mx-1 my-2 text-gray-500 hover:bg-gray-200 focus:ring-inset focus:ring-gray-300"
        >
          <Icon name="document-add" />
        </Button>
      }
      align="right"
    >
      <Dropdown.Item title="聖書">
        {items.map((item) => (
          <Dropdown.Item
            title={item.title}
            onClick={() => {
              if (layout.length > 0) {
                setSelectLayout({ name: item.modname, type: 'book' });
              } else {
                setLayout([[{ name: item.modname, type: 'book' }]]);
              }
            }}
          />
        ))}
      </Dropdown.Item>
      <Dropdown.Item
        title="辞書"
        onClick={() => {
          if (layout.length > 0) {
            setSelectLayout({ name: '', type: 'dictionary' });
          } else {
            setLayout([[{ name: '', type: 'dictionary' }]]);
          }
        }}
      />
    </Dropdown>
  );
};

export default BookSelecter;
