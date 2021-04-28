import React, { useState } from 'react';
import clsx from 'clsx';

import { Flex } from './';
import './Dropdown.css';

type ItemProps = {
  title: React.ReactElement | string;
  onClick?(e: React.MouseEvent<HTMLDivElement>): void;
  className?: string;
};

const DropdownItem: React.FC<ItemProps> = ({
  title,
  onClick,
  className,
  children,
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative overflow-hidden hover-overflow-visible',
        'items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-left',
        className
      )}
    >
      {children ? (
        <>
          <Flex justify_content="between">
            {title}
            <div className="triangle ml-4 my-1"></div>
          </Flex>
          <div className="absolute left-full top-0 bg-white py-1 rounded-md">
            {React.Children.map(children, (child) => {
              if (!React.isValidElement(child)) return null;

              return React.cloneElement(child);
            })}
          </div>
        </>
      ) : (
        <div className="w-max">{title}</div>
      )}
    </div>
  );
};

const Divider: React.FC = () => {
  return (
    <div className="py-1 bg-white">
      <hr />
    </div>
  );
};

type DropdownProps = {
  icon?: React.ReactElement;
  align: 'right' | 'left';
  className?: string;
};

type DropdownType = React.FC<DropdownProps> & {
  Item: typeof DropdownItem;
  Divider: typeof Divider;
};

const Dropdown: DropdownType = ({ icon, align = 'right', children }) => {
  const [show, setShow] = useState(false);

  return (
    <>
      {/* Background overlay */}
      {show && (
        <div
          className="fixed inset-0"
          aria-hidden="true"
          onClick={() => {
            setShow(false);
          }}
        ></div>
      )}
      <span
        onClick={() => {
          setShow((prev) => !prev);
        }}
        className="relative"
      >
        {icon}
        {show && (
          <div
            className={clsx(
              'dropdown',
              'origin-top-right absolute rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20 py-1 w-max',
              `${align}-0`,
              !show && 'hidden'
            )}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            {React.Children.map(children, (child) => {
              if (!React.isValidElement(child)) return null;

              return React.cloneElement(child);
            })}
          </div>
        )}
      </span>
    </>
  );
};

Dropdown.Item = DropdownItem;
Dropdown.Divider = Divider;

export default Dropdown;
