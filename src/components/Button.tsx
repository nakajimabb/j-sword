import React from 'react';
import clsx from 'clsx';

import { useTheme } from './ThemeProvider';
import { Size, Brand } from './type';

type ButtonProps = {
  variant?: 'contained' | 'outlined' | 'text' | 'icon';
  color?: Brand;
  size?: Size;
  onClick?(e: React.MouseEvent<HTMLButtonElement>): void;
  className?: string;
};

const Button: React.FC<ButtonProps> = ({
  variant = 'contained',
  color = 'primary',
  size = 'md',
  onClick,
  className,
  children,
  ...other
}) => {
  const { theme } = useTheme();
  const classes: string[] = [];

  // border
  classes.push('border border-transparent');
  if (variant === 'outlined') {
    classes.push(theme.border[color]);
  }

  // background-color
  if (variant === 'contained' || variant === 'icon') {
    classes.push(theme.bg[color]);
  }

  // font-size
  const textSize = {
    xs: 'text-xs',
    sm: 'text-sm leading-4',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-base',
  };
  classes.push(textSize[size]);

  // text-color
  if (variant === 'contained' || variant === 'icon') {
    const textColor = {
      primary: 'text-white',
      secondary: 'text-white',
      success: 'text-white',
      danger: 'text-white',
      warning: 'text-black',
      info: 'text-black',
      light: 'text-black',
      dark: 'text-white',
      none: 'text-gray-600',
    };
    classes.push(textColor[color]);
  } else {
    classes.push(theme.text[color]);
  }

  // font-weight
  classes.push('font-medium');

  // shadow
  if (variant === 'contained' || variant === 'icon') {
    classes.push('shadow-md');
  }

  // hover
  if (variant === 'contained' || variant === 'icon') {
    classes.push('hover:bg-opacity-75');
  } else if (variant === 'outlined') {
    classes.push('hover:bg-gray-100');
  } else {
    classes.push('hover:bg-opacity-20');
    classes.push(`hover:${theme.bg[color]}`);
  }

  // focus-ring
  if (variant === 'text') {
    classes.push('focus:outline-none');
  } else {
    classes.push('focus:outline-none focus:ring-2 focus:ring-offset-2');
    classes.push(`focus:${theme.ring[color]}`);
  }

  // padding
  if (variant === 'icon') {
    const p = { xs: 'p-1.5', sm: 'p-2', md: 'p-2', lg: 'p-2', xl: 'p-3' };
    classes.push(p[size]);
  } else {
    const px = {
      xs: 'px-2.5',
      sm: 'px-3',
      md: 'px-4',
      lg: 'px-4',
      xl: 'px-6',
    };
    const py = {
      xs: 'py-1.5',
      sm: 'py-2',
      md: 'py-2',
      lg: 'py-2',
      xl: 'py-3',
    };
    classes.push(px[size]);
    classes.push(py[size]);
  }

  // rounded
  if (variant === 'icon') {
    classes.push('rounded-full');
  } else {
    classes.push('rounded');
  }

  // width/height
  if (variant === 'icon') {
    const w = {
      xs: 'w-8',
      sm: 'w-9',
      md: 'w-10',
      lg: 'w-11',
      xl: 'w-12',
    };
    const h = {
      xs: 'h-8',
      sm: 'h-9',
      md: 'h-10',
      lg: 'h-11',
      xl: 'h-12',
    };
    classes.push(w[size], h[size]);
  }

  return (
    <button
      className={clsx(classes.join(' '), className)}
      onClick={onClick}
      {...other}
    >
      {children}
    </button>
  );
};

export default Button;
