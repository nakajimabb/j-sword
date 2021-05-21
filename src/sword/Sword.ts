import JSZip from 'jszip';
import SwordDB from './SwordDB';
import Canon from './Canon';
import zText from './zText';
import rawCom from './rawCom';
import {
  Raw,
  ModType,
  ConfType,
  BlobsType,
  ReferencesType,
  IndexesType,
  BookPos,
  BookIndex,
  DictIndex,
} from './types';
import { shapeLemma } from '../NodeObj';
import { OsisLocation } from './types';
import { parseBibleTarget } from './parseTarget';

function parseConf(str: string) {
  const lines = str.split(/[\r\n]+/g);
  let conf: ConfType = {
    modname: '',
    modtype: null,
    title: '',
    ModDrv: '',
    GlobalOptionFilter: [],
    Feature: [],
    Versification: '',
  };

  lines.forEach(function (line) {
    const splitted = line.split(/=(.+)/);
    if (splitted[0] !== '') {
      if (splitted[0].search(/\[.*\]/) !== -1) {
        conf['modname'] = splitted[0].replace('[', '').replace(']', '');
      } else if (splitted.length >= 2) {
        if (splitted[0] === 'GlobalOptionFilter') {
          conf.GlobalOptionFilter.push(splitted[1]);
        } else if (splitted[0] === 'Feature') {
          conf.Feature.push(splitted[1]);
        } else if (splitted[0] === 'Versification') {
          conf.Versification = splitted[1].toLowerCase();
        } else {
          conf[splitted[0]] = splitted[1];
        }
      }
    }
  });
  return conf;
}

function getIntFromUint8Array(
  start: number,
  ab: Uint8Array
): [number, boolean] {
  const buf = ab.subarray(start, start + 4);
  const isEnd = buf.length !== 4;
  return [
    buf[3] * 0x100000 + buf[2] * 0x10000 + buf[1] * 0x100 + buf[0],
    isEnd,
  ];
}

function getIntFromStream(start: number, u8arr: Uint8Array): [number, boolean] {
  const buf = u8arr.subarray(start, start + 4);
  let isEnd = false;
  if (buf.length !== 4) isEnd = true;
  return [
    buf[3] * 0x100000 + buf[2] * 0x10000 + buf[1] * 0x100 + buf[0],
    isEnd,
  ];
}

function getShortIntFromStream(
  start: number,
  u8arr: Uint8Array
): [number, boolean] {
  const buf = u8arr.subarray(start, start + 2);
  let isEnd = false;
  if (buf.length !== 2) isEnd = true;
  return [buf[1] * 0x100 + buf[0], isEnd];
}

function getInt48FromStream(
  start: number,
  u8arr: Uint8Array
): [number, boolean] {
  const buf = u8arr.subarray(start, start + 6);
  let isEnd = false;
  if (buf.length !== 6) isEnd = true;
  return [
    buf[1] * 0x100000000000 +
      buf[0] * 0x100000000 +
      buf[5] * 0x1000000 +
      buf[4] * 0x10000 +
      buf[3] * 0x100 +
      buf[2],
    isEnd,
  ];
}

function getBookPositions(
  u8arr: Uint8Array
): [{ [key: string]: number }[], number] {
  let startPos = 0,
    length = 0,
    unused = 0,
    start = 0;
  let end: boolean = false;
  let bookPositions = [];

  while (!end) {
    [startPos, end] = getIntFromStream(start, u8arr);
    start += 4;
    if (!end) {
      [length, end] = getIntFromStream(start, u8arr);
      start += 4;
      if (!end) {
        [unused, end] = getIntFromStream(start, u8arr);
        start += 4;
        if (end) break;
        bookPositions.push({ startPos, length, unused });
      }
    }
  }
  return [bookPositions, start];
}

function getRawPositions(
  u8arr: Uint8Array,
  inTestament: 'ot' | 'nt',
  inV11n: string
) {
  let start = 0;
  //Dump the first 12 bytes
  getInt48FromStream(start, u8arr);
  start += 6;
  getInt48FromStream(start, u8arr);
  start += 6;

  const booksStart = inTestament === 'ot' ? 0 : Canon.getBooksInOT(inV11n);
  const booksEnd =
    inTestament === 'ot'
      ? Canon.getBooksInOT(inV11n)
      : Canon.getBooksInOT(inV11n) + Canon.getBooksInNT(inV11n);
  let length = 0,
    bookData = null,
    startPos = 0,
    indexes: { [key: string]: DictIndex } = {},
    osis = '';

  for (let b = booksStart; b < booksEnd; b++) {
    bookData = Canon.getBook(b, inV11n);
    //Skip Book Record (6 bytes)
    getIntFromStream(start, u8arr);
    start += 4;
    getShortIntFromStream(start, u8arr);
    start += 2;
    for (let c = 0; c < bookData.maxChapter; c++) {
      const verseMax = Canon.getVersesInChapter(b, c + 1, inV11n);

      //Skip Chapter Record
      getIntFromStream(start, u8arr);
      start += 4;
      getShortIntFromStream(start, u8arr);
      start += 2;

      if (verseMax) {
        for (var v = 0; v < verseMax; v++) {
          startPos = getIntFromStream(start, u8arr)[0];
          start += 4;
          length = getShortIntFromStream(start, u8arr)[0];
          start += 2;
          if (length !== 0) {
            osis = `${bookData.abbrev}.${c + 1}.${v + 1}`;
            indexes[osis] = { startPos: startPos, length: length };
          }
        } //end verse
      }
    } //end chapters
  } //end books
  return indexes;
}

function dumpBytes(u8arr: Uint8Array) {
  let start = 0;

  for (var i = 0; i < 4; i++) {
    getShortIntFromStream(start, u8arr);
    start += 2;
    getInt48FromStream(start, u8arr);
    start += 6;
    getShortIntFromStream(start, u8arr);
    start += 2;
  }
  return start;
}

function getChapterVersePositions(
  u8arr: Uint8Array,
  inBookPositions: { [key: string]: number }[],
  inTestament: 'ot' | 'nt',
  versification: string
) {
  let start = dumpBytes(u8arr);
  var booksStart = inTestament === 'ot' ? 0 : Canon.getBooksInOT(versification);
  var booksEnd =
    inTestament === 'ot'
      ? Canon.getBooksInOT(versification)
      : Canon.getBooksInOT(versification) + Canon.getBooksInNT(versification);
  let chapterStartPos = 0,
    lastNonZeroStartPos = 0,
    length = 0,
    chapterLength = 0,
    bookStartPos = 0,
    booknum = 0,
    bookData = null,
    startPos = 0,
    foundEmptyChapter = 0;
  let chapters: { [key: string]: BookIndex[] } = {};
  for (let b = booksStart; b < booksEnd; b++) {
    bookData = Canon.getBook(b, versification);
    chapters[bookData.abbrev] = [];
    foundEmptyChapter = 0;
    for (let c = 0; c < bookData.maxChapter; c++) {
      chapterStartPos = 0;
      lastNonZeroStartPos = 0;
      length = 0;
      const verseMax = Canon.getVersesInChapter(b, c + 1, versification);
      if (!verseMax) continue;

      let chapt: BookIndex = {
        bookStartPos: 0,
        booknum: 0,
        length: 0,
        startPos: 0,
        verses: [],
      };
      for (let v = 0; v < verseMax; v++) {
        booknum = getShortIntFromStream(start, u8arr)[0];
        start += 2;
        startPos = getInt48FromStream(start, u8arr)[0];
        start += 6;
        if (startPos !== 0) lastNonZeroStartPos = startPos;
        length = getShortIntFromStream(start, u8arr)[0];
        start += 2;
        if (v === 0) {
          chapterStartPos = startPos;
          bookStartPos = 0;
          if (booknum < inBookPositions.length) {
            bookStartPos = inBookPositions[booknum].startPos;
          }
          chapt.startPos = chapterStartPos;
          chapt.booknum = b;
          chapt.bookStartPos = bookStartPos;
        }
        if (booknum === 0 && startPos === 0 && length === 0) {
          chapt.verses.push({ startPos: 0, length: 0 });
        } else {
          chapt.verses.push({
            startPos: startPos - chapterStartPos,
            length: length,
          });
        }
      } //end verse
      if (chapt.verses.length > 0) {
        chapterLength = lastNonZeroStartPos - chapterStartPos + length;
        chapt.length = chapterLength;
        chapters[bookData.abbrev].push(chapt);
        if (isNaN(chapterLength) || chapterLength === 0) {
          foundEmptyChapter++;
        }
      }
      // dump a post for the chapter break
      getShortIntFromStream(start, u8arr);
      start += 2;
      getInt48FromStream(start, u8arr);
      start += 6;
      getShortIntFromStream(start, u8arr);
      start += 2;
    } //end chapters
    if (foundEmptyChapter === bookData.maxChapter) {
      delete chapters[bookData.abbrev];
    }
    // dump a post for the book break
    getShortIntFromStream(start, u8arr);
    start += 2;
    getInt48FromStream(start, u8arr);
    start += 6;
    getShortIntFromStream(start, u8arr);
    start += 2;
  } //end books
  return chapters;
}

class Sword {
  modname: string;
  modtype: ModType | null;
  title: string;
  conf: ConfType | null;
  blob: BlobsType | null;
  index: IndexesType | null;
  reference: ReferencesType | null;
  constructor(
    modname: string,
    modtype: ModType | null,
    title: string,
    conf: ConfType | null = null,
    blob: BlobsType | null = null,
    index: IndexesType | null = null,
    reference: ReferencesType | null = null
  ) {
    this.modname = modname;
    this.modtype = modtype;
    this.title = title;
    this.conf = conf;
    this.blob = blob;
    this.index = index;
    this.reference = reference;
  }

  async countWordByBook(lemma: string) {
    const reference = await this.getReference(lemma);
    if(reference) {
    let sum: { [book: string]: number } = {};
    for (let book in reference) {
      for (let chapter in reference[book]) {
        if (!sum.hasOwnProperty(book)) sum[book] = 0;
        for (let verse in reference[book][chapter]) {
          sum[book] += reference[book][chapter][verse];
        }
      }
    }
    return sum;
    }
  };
  
  async countWord(lemma: string) {
    const counts = await this.countWordByBook(lemma);
    if(counts) {
      return Object.values(counts).reduce((i,j) => i + j, 0);
    }
  }

  async search(str: string, callback: (delta: number) => void) {
    const index = this.index || (await SwordDB.getIndex(this.modname));
    if(this.modtype === 'dictionary') {
      if(index && index.dict) {
        const keys = Object.keys(index.dict);
        const taskCount = 100;
        const unitCount = Math.ceil(keys.length / taskCount);
        const splitKeys: string[][] = [];
        for(let i = 0; i < taskCount; i++) {
          splitKeys.push(keys.slice(i*unitCount, (i+1)*unitCount))
        }

        const t1 = new Date();
        const tasks = splitKeys.map(async (keys2, i) => {
          const res: {key: string, raw: string}[] = [];
          for await(const key of keys2) {
            const raw = await this.getRawText(key);
            const m = raw.match(str);
            callback(100.0 / keys.length);
            if(m) res.push({key, raw});
          }
          return res;
        });
        const results = await Promise.all(tasks);
        const t2 = new Date();
        console.log({total: (t2.getTime() - t1.getTime())/1000});
        return results.flat();
      }
    } else if(this.modtype === 'bible') {
      if(index && (index.ot || index.nt)) {
        const all_book_indexes = Object.assign(
          {},
          index.ot || {},
          index.nt || {}
        );
        const osisRefs: string[] = [];
        for (const book in all_book_indexes) {
          const book_indexes = all_book_indexes[book];
          for (let chapter = 1; chapter <= book_indexes.length; ++chapter) {
            osisRefs.push(book + '.' + chapter);
          }
        }

        const tasks = osisRefs.map(async osisRef => {
          const raws = await this.renderText(osisRef, {
            footnotes: false,
            crossReferences: true,
            oneVersePerLine: true,
            headings: true,
            wordsOfChristInRed: true,
            intro: true,
            array: false,
          });
          const results: {key: string, raw: string}[] = [];
          if(raws && raws.length > 0) {
            for(const raw of raws) {
              const m = raw.text.match(str);
              if(m) results.push({key: raw.osisRef, raw: raw.text});
            }
          }
          return results;
        });
        const results = await Promise.all(tasks);
        return results.filter(result => result).flat();
      }
    }
    return [];
  }

  static parseVerse(str: string) {
    const strs = str.split(',');
    const verses: number[] = [];
    strs.forEach(s => {
      const strs2 = s.split('-').filter(s2 => s2);
      if(strs2.length === 1) {
        verses.push(+strs2[0]);
      } else {
        const v1 = strs2[0];
        const v2 = strs2[1];
        for(let i = +v1; i <= +v2; ++i) {
          verses.push(i);
        }
      }
    })
    return verses;
  }
  
  static parseVKey(inVKey: string, inV11n: string) {
    const bookPos: BookPos[] = [];
    const result = parseBibleTarget(inVKey);
    if (result) {
      const {book, chapter, verse} = result;
      const bookNum= Canon.getBookNum(book, inV11n);
      if(verse) {
        const verses = Sword.parseVerse(verse);
        verses.forEach(verse => {
          bookPos.push({
            book,
            chapter,
            bookNum,
            verse,
            osisRef: `${book}.${chapter}:${verse}`,
          })
        })
      } else {
        const verseMax = Canon.getVersesInChapter(bookNum, chapter, inV11n) || 1;
        for(let verse = 1; verse <= verseMax; ++verse) {
          bookPos.push({
            book,
            chapter,
            bookNum,
            verse,
            osisRef: `${book}.${chapter}:${verse}`,
          });
          }
      }
    }
    return bookPos;
  }

  isValid() {
    return !!this.conf;
  }

  async getReference(key: string) {
    const reference =
      this.reference || (await SwordDB.getReference(this.modname));
    if (reference && reference.indexes && key in reference.indexes) {
      return reference.indexes[key];
    }
  }

  async getRawText(key: string) {
    const dec = new TextDecoder();
    const index = this.index || (await SwordDB.getIndex(this.modname));
    const blob = this.blob || (await SwordDB.getBlob(this.modname));
    return new Promise<string>((resolve) => {
      if (index && index.dict && key in index.dict) {
        const pos = index.dict[key];
        if (pos && blob && blob.dict) {
          let raeder = new FileReader();
          raeder.readAsArrayBuffer(blob.dict);
          raeder.onload = async function (e: any) {
            const ab = new Uint8Array(e.target.result);
            const ab2 = ab.slice(pos.startPos, pos.startPos + pos.length);
            const raw_text = dec.decode(ab2);
            resolve(raw_text);
          };
        } else {
          resolve('');
        }
      } else {
        resolve('');
      }
    });
  }

  async renderText2(vList: BookPos[], inOptions: { [key: string]: boolean }) {
    const indexes = this.index || (await SwordDB.getIndex(this.modname));
    const blobs = this.blob || (await SwordDB.getBlob(this.modname));
    if (this.conf && indexes && blobs) {
      if (vList.length !== 0 && vList[0].osisRef !== '') {
        let index_bible: BookIndex[] | undefined;
        let index_dict: DictIndex | undefined;
        let blob: Blob | undefined;

        const book = vList[0].book;
        const osisRef1 = vList[0].osisRef;
        const osisRef2 = osisRef1 && osisRef1.replace(':', '.');
        if (indexes.nt && book in indexes.nt) {
          index_bible = indexes.nt[book];
          blob = blobs.nt;
        } else if (indexes.ot && book in indexes.ot) {
          index_bible = indexes.ot[book];
          blob = blobs.ot;
        } else if (
          indexes.dict_ot &&
          (osisRef1 in indexes.dict_ot || osisRef2 in indexes.dict_ot)
        ) {
          index_dict = indexes.dict_ot[osisRef1] || indexes.dict_ot[osisRef2];
          blob = blobs.ot;
        } else if (
          indexes.dict_nt &&
          (osisRef1 in indexes.dict_nt || osisRef2 in indexes.dict_nt)
        ) {
          index_dict = indexes.dict_nt[osisRef1] || indexes.dict_nt[osisRef2];
          blob = blobs.nt;
        }

        if (this.conf.ModDrv === 'zText' || this.conf.ModDrv === 'zCom') {
          if (index_bible && blob) {
            const inRaw = await zText.getRawEntry(
              blob,
              index_bible,
              vList,
              String(this.conf.Encoding),
              inOptions.intro ? inOptions.intro : false
            );
            return inRaw;
          } else {
            throw 'The requested chapter is not available in this module.';
          }
        } else if (this.conf.ModDrv === 'RawCom') {
          if (index_dict && blob) {
            const inRaw = await rawCom.getRawEntry(
              blob,
              index_dict,
              vList,
              String(this.conf.Encoding)
            );
            return inRaw;
          } else {
            throw 'The requested chapter is not available in this module.';
          }
        }
      } else {
        throw 'Wrong passage. The requested chapter is not available in this module.';
      }
    }
  }

  async renderText(inVKey: string, inOptions: { [key: string]: boolean }) {
    const indexes = this.index || (await SwordDB.getIndex(this.modname));
    const blobs = this.blob || (await SwordDB.getBlob(this.modname));
    if (this.conf && indexes && blobs) {
      const inV11n = String(this.conf.Versification);
      const vList = Sword.parseVKey(inVKey, inV11n);
      return this.renderText2(vList, inOptions);
    }
  }

  static async load(modname: string) {
    const conf = await SwordDB.getConf(modname);
    if (conf) {
      const index = null; //await SwordDB.getIndex(conf.modname);
      const blob = null; //await SwordDB.getBlob(conf.modname);
      return new Sword(
        conf.modname,
        conf.modtype,
        conf.title,
        conf,
        blob,
        index
      );
    }
  }

  static async loadAll(modtype: ModType) {
    let modules: { [key: string]: Sword } = {};
    const confs = await SwordDB.getConfs(modtype);
    for (let conf of confs) {
      const index = null; //await SwordDB.getIndex(conf.modname);
      const blob = null; //await SwordDB.getBlob(conf.modname);
      modules[conf.modname] = new Sword(
        conf.modname,
        conf.modtype,
        conf.title,
        conf,
        blob,
        index
      );
    }
    return modules;
  }

  async installReference(blob: Blob) {
    const zip = await JSZip.loadAsync(blob);
    for (var name in zip.files) {
      const m = name.match(/^(\w+).json$/);
      if (m) {
        const json_text = await zip.files[name].async('text');
        const indexes = JSON.parse(json_text);
        await SwordDB.saveReference({ indexes, modname: this.modname });
      }
    }
  }

  static async install(blob: Blob, modtype: ModType, title: string) {
    if (modtype === 'bible') {
      return Sword.installBible(blob, title);
    } else {
      return Sword.installModule(blob, modtype, title);
    }
  }

  static async installBible(blob: Blob, title: string) {
    const zip = await JSZip.loadAsync(blob);
    // first read config file
    const conf_name = Object.keys(zip.files).find(
      (name) => name.search(/.conf/) !== -1
    );
    if (!conf_name) throw 'not found config file.';

    const confBuf = await zip.files[conf_name].async('text');
    const conf = parseConf(confBuf);
    if (conf) {
      // read files
      let files: { [key: string]: Uint8Array } = {};
      let blobs: { [key: string]: Blob } = {};
      for (var name in zip.files) {
        if (name.search('.conf') === -1) {
          const u8arr = await zip.files[name].async('uint8array');
          if (conf.ModDrv === 'zText' || conf.ModDrv === 'zCom') {
            if (name.search(/nt.[bc]zs/) !== -1) {
              files.nt_zs = u8arr;
            } else if (name.search(/nt.[bc]zv/) !== -1) {
              files.nt_zv = u8arr;
            } else if (name.search(/ot.[bc]zs/) !== -1) {
              files.ot_zs = u8arr;
            } else if (name.search(/ot.[bc]zv/) !== -1) {
              files.ot_zv = u8arr;
            } else {
              const m = name.match(/(nt|ot).\w+$/);
              if (m && m[1]) {
                blobs[m[1]] = new Blob([u8arr]);
              }
            }
          } else if (conf.ModDrv === 'RawCom') {
            if (name.search(/nt.vss/) !== -1) {
              files.nt_vss = u8arr;
            } else if (name.search(/ot.vss/) !== -1) {
              files.ot_vss = u8arr;
            } else {
              const m = name.match(/(nt|ot)$/);
              if (m && m[1]) {
                blobs[m[1]] = new Blob([u8arr]);
              }
            }
          }
        }
      }
      // create indexes
      const indexes = await Sword.createBibleIndexes(
        files,
        conf.ModDrv,
        conf.Versification
      );
      // save stores
      const modname = await SwordDB.saveConf({
        ...conf,
        modtype: 'bible',
        title,
      });
      await SwordDB.saveBlob({ ...blobs, modname });
      await SwordDB.saveIndex({ ...indexes, modname });
    }
  }

  static async createBibleIndexes(
    u8arr: { [key: string]: Uint8Array },
    modDrv: string,
    versification: string
  ) {
    let start = 0,
      bookPosOT = null,
      bookPosNT = null;
    let rawPosNT: { [key: string]: BookIndex[] } = {};
    let rawPosOT: { [key: string]: BookIndex[] } = {};
    let rawPosDictNT: { [key: string]: DictIndex } = {};
    let rawPosDictOT: { [key: string]: DictIndex } = {};

    if (modDrv === 'zText' || modDrv === 'zCom') {
      if (u8arr.ot_zs || u8arr.ot_zv) {
        [bookPosOT, start] = getBookPositions(u8arr.ot_zs);
        rawPosOT = getChapterVersePositions(
          u8arr.ot_zv,
          bookPosOT,
          'ot',
          versification
        );
      }
      if (u8arr.nt_zs || u8arr.nt_zv) {
        [bookPosNT, start] = getBookPositions(u8arr.nt_zs);
        rawPosNT = getChapterVersePositions(
          u8arr.nt_zv,
          bookPosNT,
          'nt',
          versification
        );
      }
    } else if (modDrv === 'RawCom') {
      if (u8arr.ot_vss) {
        rawPosDictOT = getRawPositions(u8arr.ot_vss, 'ot', versification); // add last paramter: versification
      }
      if (u8arr.nt_vss) {
        rawPosDictNT = getRawPositions(u8arr.nt_vss, 'nt', versification); // add last paramter: versification
      }
    }
    return {
      ot: rawPosOT,
      nt: rawPosNT,
      dict_ot: rawPosDictOT,
      dict_nt: rawPosDictNT,
    };
  }

  static async installModule(blob: Blob, modtype: ModType, title: string) {
    const zip = await JSZip.loadAsync(blob);
    // first read config file
    const conf_name = Object.keys(zip.files).find(
      (name) => name.search(/.conf/) !== -1
    );
    if (!conf_name) throw 'not found config file.';
    const confBuf = await zip.files[conf_name].async('text');
    const conf = parseConf(confBuf);

    if (conf) {
      let files: { [key: string]: Uint8Array } = {};
      // read files
      for (var name in zip.files) {
        const u8arr = await zip.files[name].async('uint8array');
        if (name.search(/.idx/) !== -1) {
          files.indexes = u8arr;
        } else if (name.search(/.dat/) !== -1) {
          files.blobs = u8arr;
        }
      }
      // create indexes
      const indexes = await Sword.createIndexes(files.indexes, files.blobs);
      // save stores
      const modname = await SwordDB.saveConf({ ...conf, modtype, title });
      await SwordDB.saveIndex({ modname, dict: indexes });
      await SwordDB.saveBlob({
        modname,
        dict: new Blob([files.blobs]),
      });
    }
  }

  static async createIndexes(idxBuf: Uint8Array, blobBuf: Uint8Array) {
    const dec = new TextDecoder();
    let i1,
      len,
      isEnd = false;
    let indexes: { [key: string]: DictIndex } = {};
    for (let start = 0; !isEnd; start += 8) {
      [i1, isEnd] = getIntFromUint8Array(start, idxBuf);
      [len, isEnd] = getIntFromUint8Array(start + 4, idxBuf);
      const buf = blobBuf.slice(i1, i1 + len);
      const result = dec.decode(buf);
      const m = result.match(/^(.+)(\r\n|\r|\n)/);
      if (m) {
        const key = m[1];
        const length = m[1].length + m[2].length;
        indexes[key] = { startPos: i1 + length, length: len - length };
      }
    }
    return indexes;
  }

  get lang() {
    const lang = String(this.conf?.Lang)
    return lang === 'hbo' ? 'he' : lang;
  }

  async createReference() {
    const lang = this.lang;
    const index = this.index || (await SwordDB.getIndex(this.modname));
    if (index) {
      const all_book_indexes = Object.assign(
        {},
        index.ot || {},
        index.nt || {}
      );
      const book_poses: string[] = [];
      for (const book in all_book_indexes) {
        const book_indexes = all_book_indexes[book];
        for (let chapter = 1; chapter <= book_indexes.length; ++chapter) {
          book_poses.push(book + '.' + chapter);
        }
      }
      const locations: { [lemma: string]: OsisLocation } = {};
      for await (let book_pos of book_poses) {
        const raws = await this.renderText(book_pos, {
          footnotes: false,
          crossReferences: true,
          oneVersePerLine: true,
          headings: true,
          wordsOfChristInRed: true,
          intro: true,
          array: false,
        });
        if (raws) raws.forEach((raw) => countLemma(raw, locations, lang));
      }
      return locations;
    }
  }

  async remove() {
    await SwordDB.remove(this.modname);
  }
}

export const extractLemma = (
  node: Node,
  pos: { book: string; chapter: number; verse: number },
  locations: { [lemma: string]: OsisLocation },
  lang: string
) => {
  const attrs =
    node instanceof Element && node.attributes
      ? Object.assign(
          {},
          ...Array.from(node.attributes).map((attr) => ({
            [attr.name]: attr.nodeValue,
          }))
        )
      : {};
  if (attrs.lemma) {
    let lemma: string = attrs.lemma.split(':').pop() || '';
    if (lemma) {
      lemma = shapeLemma(lemma, lang);
      if (!locations[lemma]) { locations[lemma] = {}; }
      if (!locations[lemma][pos.book]) { locations[lemma][pos.book] = {}; }
      if (!locations[lemma][pos.book][pos.chapter]) {
        locations[lemma][pos.book][pos.chapter] = {};
      }
      if (!locations[lemma][pos.book][pos.chapter][pos.verse]) {
        locations[lemma][pos.book][pos.chapter][pos.verse] = 0;
      }
      locations[lemma][pos.book][pos.chapter][pos.verse] += 1;
    }
  }
  node.childNodes.forEach((child) => {
    extractLemma(child, pos, locations, lang);
  });
};

const countLemma = (raw_text: Raw, locations: { [lemma: string]: OsisLocation }, lang: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    '<root>' + raw_text.text + '</root>',
    'text/xml'
  );
  const root = doc.childNodes[0];
  const m = raw_text.osisRef.match(/^(\w+).(\d+).(\d+)$/);
  if (m) {
    extractLemma(
      root,
      { book: m[1], chapter: +m[2], verse: +m[3] },
      locations,
      lang
    );
  }
  return locations;
};

export default Sword;
