import React from 'react';
import { Flex } from './components';

type Props = {
  title: string | React.ReactElement;
  menu?: React.ReactElement;
};

const FrameView: React.FC<Props> = ({ title, menu, children }) => {
  return (
    <div className="relative">
      <nav className="w-full h-6 px-2 absolute shadow top-0 bg-yellow-100">
        <Flex justify_content="between" align_items="center" className="h-full">
          <small>{title}</small>
          {menu}
        </Flex>
      </nav>
      <div className="w-full h-full pt-6">
        <div className="w-full h-full overflow-scroll overflow-x-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FrameView;
