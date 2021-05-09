export type CustomClaims = {
  role?: 'manager' | 'admin';
}

export type ModType = 'bible' | 'dictionary' | 'morphology';

export type Module = {
  modname: string;
  modtype: ModType;
  secrecy: 'public' | 'protected' | 'private';
  title: string;
  lang: 'ja' | 'he' | 'grc' | 'en';
  dependencies: string[];
  path: string;
  referencePath?: string;
}

export type Book = {
  title: string;
  published: boolean;
  headings: {id:string, item: string, title: string, published: boolean}[];
}

export type Article = {
  part?: number;
  chapter?: number;
  section?: number;
  title: string;
  content: string;
  published: boolean;
}

export type Target = {
  mode: 'bible' | 'word' | 'text';
  search: string;
};

export type Layout = {
  modname: string;  // or docId
  type: 'bible' | 'dictionary' | 'book';
};

export type Setting = {
  name: string;
  history: Target[];
  layouts: Layout[][];
};
