import React from 'react';
import { IconButton, Snackbar, SnackbarContent } from '@material-ui/core';
import { Close as CloseIcon } from '@material-ui/icons';

const severities = ['error', 'warning', 'info', 'success'] as const;
type Severity = typeof severities[number];

export interface AlertMessage {
  content: string | string[];
  severity?: Severity;
}

interface AlertProps {
  message: string | string[];
  severity?: Severity;
  horizontal?: 'center' | 'left' | 'right';
  vertical?: 'bottom' | 'top';
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({
  message,
  severity,
  horizontal = 'center',
  vertical = 'bottom',
  onClose,
}) => {
  let color;
  switch (severity) {
    case 'warning':
      color = '#ff9800';
      break;
    case 'info':
      color = '#2196f3';
      break;
    case 'success':
      color = '#4caf50';
      break;
    default:
      color = '#f44336';
  }

  return (
    <Snackbar
      open={true}
      anchorOrigin={{
        vertical,
        horizontal,
      }}
    >
      <SnackbarContent
        message={
          Array.isArray(message) ? (
            <div>
              {message.map((m, index) => (
                <div key={index} style={{ textAlign: 'left' }}>
                  {m}
                </div>
              ))}
            </div>
          ) : (
            message
          )
        }
        style={{ margin: 20, backgroundColor: color }}
        action={
          onClose
            ? [
                <IconButton
                  key="close"
                  aria-label="Close"
                  color="inherit"
                  onClick={onClose}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>,
              ]
            : null
        }
      />
    </Snackbar>
  );
};

Alert.defaultProps = {
  severity: 'error',
};

export default Alert;
