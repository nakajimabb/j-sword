export type Brand = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'light' | 'dark' | 'none';
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Size2 = Size | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full' | 'max';

export type NestedProps = {
  [first: string]: string | {
    [second: string]: string | {
      [third: string]: string | {
        [forth: string]: string | {
          [fifth: string]: string;
        }
      }
    }
  }
};
