export interface Raw {
  text: string;
  osisRef: string;
  verse: number;
}

export interface BookPos {
  book: string;
  bookNum: number;
  chapter: number;
  verse: number;
  osisRef: string;
}

export interface BookIndex {
  bookStartPos: number;
  booknum: number;
  length: number;
  startPos: number;
  verses: { startPos: number; length: number }[];
}

export interface DictIndex {
  startPos: number;
  length: number;
}

export interface IndexesType {
  modname: string;
  ot?: { [book: string]: BookIndex[] };
  nt?: { [book: string]: BookIndex[] };
  dict_ot?: { [key: string]: DictIndex };
  dict_nt?: { [key: string]: DictIndex };
  dict?: { [key: string]: DictIndex };
}

export interface OsisLocation {
  [book: string]: { [chapter: number]: {[verse: number]: number} };
}

export interface ReferencesType {
  modname: string;
  indexes: {[modname: string]: OsisLocation};
}

export type ModType = 'bible' | 'dictionary' | 'morphology';

export interface ConfType {
  [key: string]: unknown;
  modname: string;
  title: string;
  modtype: ModType | null;
  ModDrv: string;
  GlobalOptionFilter: string[];
  Feature: string[];
  Versification: string;
}

export interface BlobsType {
  modname: string;
  ot?: Blob;
  nt?: Blob;
  dict?: any;
}
