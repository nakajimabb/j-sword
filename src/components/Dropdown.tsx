import React, { useState } from 'react';
import clsx from 'clsx';

type ItemProps = {
  onClick?(e: React.MouseEvent<HTMLDivElement>): void;
  className?: string;
};

const DropdownItem: React.FC<ItemProps> = ({
  onClick,
  className,
  children,
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900',
        className
      )}
    >
      {children}
    </div>
  );
};

const Divider: React.FC = () => {
  return <hr className="my-1" />;
};

type DropdownProps = {
  icon?: React.ReactElement;
  className?: string;
};

type DropdownType = React.FC<DropdownProps> & {
  Item: typeof DropdownItem;
  Divider: typeof Divider;
};

const Dropdown: DropdownType = ({ icon, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <div onClick={() => setShow((prev) => !prev)}>{icon}</div>
      {/* Background overlay */}
      {show && (
        <div
          className="fixed inset-0"
          aria-hidden="true"
          onClick={() => setShow(false)}
        ></div>
      )}
      <div
        className={clsx(
          'origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20 py-1',
          !show && 'hidden'
        )}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="options-menu"
      >
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) {
            return null;
          }

          return React.cloneElement(child, {
            onClick: () => {
              if (child.props.onClick) child.props.onClick();
              setShow(false);
            },
          });
        })}
      </div>
    </div>
  );
};

Dropdown.Item = DropdownItem;
Dropdown.Divider = Divider;

export default Dropdown;
