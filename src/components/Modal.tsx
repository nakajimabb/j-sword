import React from 'react';
import clsx from 'clsx';

import { Size2 } from './type';

type Props = {
  className?: string;
};

const ModalHeader: React.FC<Props> = ({ className, children }) => {
  return (
    <h1 className={clsx('bg-white px-6 pt-4 pb-2 border', className)}>
      {children}
    </h1>
  );
};

const ModalBody: React.FC<Props> = ({ className, children }) => {
  return <div className={clsx('bg-white p-4', className)}>{children}</div>;
};

const ModalFooter: React.FC<Props> = ({ className, children }) => {
  return (
    <div className={clsx('bg-gray-50 px-4 py-3 border', className)}>
      {children}
    </div>
  );
};

type CloseButtonProps = {
  onClose?(): void;
};

const CloseButton: React.FC<CloseButtonProps> = ({ onClose }) => {
  return (
    <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
      <button
        type="button"
        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={onClose}
      >
        <span className="sr-only">Close</span>
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

type ModalProps = {
  open: boolean;
  size?: Size2;
  showCloseButton?: boolean;
  onClose?(): void;
};

type ModalType = React.FC<ModalProps> & {
  Header: typeof ModalHeader;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
};

const Modal: ModalType = ({
  open,
  size = 'lg',
  showCloseButton,
  onClose,
  children,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed z-10 inset-0 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>
        <div
          className={clsx(
            'inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all  max-w-full',
            `sm:max-w-${size}`
          )}
        >
          {showCloseButton && <CloseButton onClose={onClose} />}
          {children}
        </div>
      </div>
    </div>
  );
};

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
