import React from 'react';
import { Flex } from './components';

type Props = {
  docId?: string;
  creating?: boolean;
};

const BookView: React.FC<Props> = ({ docId, creating = false, children }) => {
  return <div className="relative"></div>;
};

export default BookView;
