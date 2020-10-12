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

type References = {
  [lemma: string]: {
    [book: string]: { [chapter: number]: { [verse: number]: number } };
  };
};

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
  // modtype: 'bible', 'dictionary', 'morphology',
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

  static parseVkey(inVKey: string, inV11n: string) {
    const m = inVKey.match(/^(\w+).(\d+)(:(\d+))*$/);
    if (m) {
      return {
        book: m[1],
        chapter: +m[2],
        bookNum: Canon.getBookNum(m[1], inV11n),
        verse: +m[4],
        osisRef: inVKey,
      };
    }
  }

  static parseVerseList(inVKey: string, inV11n: string): BookPos[] {
    let verseList: BookPos[] = [];
    let key = Sword.parseVkey(inVKey, inV11n);
    if (key) {
      //Check if we have a passage range like John.3.10-John.3.16 or Gen.3-Gen.4
      if (key.osisRef.search('-') !== -1) {
        let singlePassages = key.osisRef.split('-'),
          start = singlePassages[0].split('.'),
          end = singlePassages[1].split('.');

        if (!isNaN(key.verse) && end.length === 3) {
          var bookNum = Canon.getBookNum(key.book, inV11n); // added
          for (let z = key.verse; z < parseInt(end[2], 10) + 1; z++) {
            verseList.push({
              osisRef: key.book + '.' + key.chapter + '.' + z,
              book: key.book,
              bookNum: bookNum,
              chapter: key.chapter,
              verse: z,
            });
          }
        }
        //check if we have a passage like Mt 3 or Ps 123
      } else if (isNaN(key.verse)) {
        const bookNum = Canon.getBookNum(key.book, inV11n);
        const verseMax = Canon.getVersesInChapter(bookNum, key.chapter, inV11n);
        if (verseMax) {
          for (let i = 0; i < verseMax; i++) {
            verseList.push({
              osisRef: key.book + '.' + key.chapter + '.' + (i + 1),
              book: key.book,
              bookNum: bookNum,
              chapter: key.chapter,
              verse: i + 1,
            });
          }
        }
      } else {
        verseList.push(key);
      }
    }
    return verseList;
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

  async renderText(inVKey: string, inOptions: { [key: string]: boolean }) {
    const indexes = this.index || (await SwordDB.getIndex(this.modname));
    const blobs = this.blob || (await SwordDB.getBlob(this.modname));
    if (this.conf && indexes && blobs) {
      const inV11n = String(this.conf.Versification);
      let vList = Sword.parseVerseList(inVKey, inV11n);
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

  async createReference() {
    const lang = String(this.conf?.Lang);
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
      const references: References = {};
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
        if (raws) raws.forEach((raw) => countLemma(raw, references, lang));
      }
      return references;
    }
  }

  async remove() {
    await SwordDB.remove(this.modname);
  }
}

export const extractLemma = (
  node: Node,
  pos: { book: string; chapter: number; verse: number },
  references: References,
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
      if (!references[lemma]) references[lemma] = {};
      if (!references[lemma][pos.book]) references[lemma][pos.book] = {};
      if (!references[lemma][pos.book][pos.chapter])
        references[lemma][pos.book][pos.chapter] = {};
      if (!references[lemma][pos.book][pos.chapter][pos.verse])
        references[lemma][pos.book][pos.chapter][pos.verse] = 0;
      references[lemma][pos.book][pos.chapter][pos.verse] += 1;
    }
  }
  node.childNodes.forEach((child) => {
    extractLemma(child, pos, references, lang);
  });
};

const countLemma = (raw_text: Raw, references: References, lang: string) => {
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
      references,
      lang
    );
  }
  return references;
};

export default Sword;
