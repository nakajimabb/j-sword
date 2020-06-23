import kjv from './canons/kjv.json';
import german from './canons/german.json';
import catholic from './canons/catholic.json';
import catholic2 from './canons/catholic2.json';
import kjva from './canons/kjva.json';
import leningrad from './canons/leningrad.json';
import luther from './canons/luther.json';
import lxx from './canons/lxx.json';
import mt from './canons/mt.json';
import nrsv from './canons/nrsv.json';
import nrsva from './canons/nrsva.json';
import orthodox from './canons/orthodox.json';
import synodal from './canons/synodal.json';
import synodalprot from './canons/synodalprot.json';
import vulg from './canons/vulg.json';

type BookInfo = {
  name: string;
  abbrev: string;
  maxChapter: number;
};

export const canons: {
  [key: string]: {
    ot: BookInfo[];
    nt: BookInfo[];
    versesInChapter: number[][];
    osisToBookNum: { [key: string]: number };
  };
} = {
  kjv,
  german: { ...german, nt: kjv.nt, osisToBookNum: kjv.osisToBookNum },
  catholic: { ...catholic, osisToBookNum: kjv.osisToBookNum },
  catholic2: { ...catholic2, osisToBookNum: kjv.osisToBookNum },
  kjva: { ...kjva, osisToBookNum: kjv.osisToBookNum },
  leningrad: { ...leningrad, osisToBookNum: kjv.osisToBookNum },
  luther: { ...luther, osisToBookNum: kjv.osisToBookNum },
  lxx: { ...lxx, osisToBookNum: kjv.osisToBookNum },
  mt,
  nrsv: { ...nrsv, osisToBookNum: kjv.osisToBookNum },
  nrsva: { ...nrsva, osisToBookNum: kjv.osisToBookNum },
  orthodox: { ...orthodox, osisToBookNum: kjv.osisToBookNum },
  synodal: { ...synodal, osisToBookNum: kjv.osisToBookNum },
  synodalprot: { ...synodalprot, osisToBookNum: kjv.osisToBookNum },
  vulg,
};

class Canon {
  static getBooksInOT(v11n: string): number {
    if (v11n && canons[v11n]) return canons[v11n].ot.length;
    else return canons.kjv.ot.length;
  }

  static getBooksInNT(v11n: string): number {
    if (v11n && canons[v11n]) return canons[v11n].nt.length;
    else return canons.kjv.nt.length;
  }

  static getChapterMax(inBookNum: number, v11n: string) {
    inBookNum = inBookNum < 0 ? 0 : inBookNum;
    var booksOT = Canon.getBooksInOT(v11n);
    var testament: 'ot' | 'nt' = inBookNum < booksOT ? 'ot' : 'nt';
    inBookNum = inBookNum < booksOT ? inBookNum : inBookNum - booksOT;
    if (v11n !== undefined && canons[v11n])
      return canons[v11n][testament][inBookNum].maxChapter;
    else return canons.kjv[testament][inBookNum].maxChapter;
  }

  static getVersesInChapter(
    inBookNum: number,
    inChapter: number,
    v11n: string
  ) {
    if (v11n !== undefined && canons[v11n]) {
      if (canons[v11n].versesInChapter?.hasOwnProperty(inBookNum)) {
        return canons[v11n].versesInChapter[inBookNum][inChapter - 1];
      }
    } else {
      if (canons.kjv.versesInChapter?.hasOwnProperty(inBookNum)) {
        return canons.kjv.versesInChapter[inBookNum][inChapter - 1];
      }
    }
  }

  static getBook(inBookNum: number, v11n: string) {
    inBookNum = inBookNum < 0 ? 0 : inBookNum;
    var booksOT = Canon.getBooksInOT(v11n);
    var testament: 'ot' | 'nt' = inBookNum < booksOT ? 'ot' : 'nt';
    inBookNum = inBookNum < booksOT ? inBookNum : inBookNum - booksOT;
    if (v11n !== undefined && canons[v11n])
      return canons[v11n][testament][inBookNum];
    else return canons.kjv[testament][inBookNum];
  }

  static getBookNum(inOsis: string, v11n: string) {
    if (v11n && canons[v11n]) return canons[v11n].osisToBookNum[inOsis];
    else return canons.kjv.osisToBookNum[inOsis];
  }
}

export default Canon;
