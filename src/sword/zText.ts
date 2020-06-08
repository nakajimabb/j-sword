import { Raw, BookPos, BookIndex } from './types';
var pako = require('pako');

async function readBlobText(
  inVList: BookPos[],
  inEcoding: string,
  blob: Blob,
  notIntro: boolean,
  z: number
) {
  return new Promise<Raw>((resolve, reject) => {
    let textReader = new FileReader();
    if (!inEcoding) {
      textReader.readAsText(blob, 'CP1252');
    } else {
      textReader.readAsText(blob, inEcoding);
    }
    textReader.onload = async function (e) {
      if (e.target && e.target.result && typeof e.target.result === 'string') {
        if (notIntro) {
          resolve({
            text: e.target.result,
            osisRef: inVList[z].book + '.' + inVList[z].chapter + '.0',
            verse: 0,
          });
        } else {
          resolve({
            text: e.target.result,
            osisRef: inVList[z].osisRef,
            verse: inVList[z].verse,
          });
        }
      }
      reject();
    };
  });
}

async function getRawEntry(
  inBlob: Blob,
  inPos: BookIndex[],
  inVList: BookPos[],
  inEcoding: string,
  inIntro: boolean
) {
  return new Promise<Raw[]>((resolve, reject) => {
    let zlibReader = new FileReader();
    if (!inPos[inVList[0].chapter - 1]) {
      reject(
        'Wrong passage. The requested chapter is not available in this module.'
      );
    } else {
      let bookStartPos = inPos[inVList[0].chapter - 1].bookStartPos,
        startPos = inPos[inVList[0].chapter - 1].startPos,
        length = inPos[inVList[0].chapter - 1].length,
        chapterStartPos = bookStartPos + startPos,
        chapterEndPos = chapterStartPos + length,
        blob = inBlob.slice(bookStartPos, chapterEndPos);

      //Return Intro (=Book.Chapter.0) only, if vList.length > 1 or verseNumber === 1
      if (inVList.length === 1 && inVList[0].verse !== 1) {
        inIntro = false;
      }

      zlibReader.readAsArrayBuffer(blob);
      zlibReader.onload = async function (e) {
        if (
          e.target &&
          e.target.result &&
          e.target.result instanceof ArrayBuffer
        ) {
          var inflator = new pako.Inflate();
          var view = new Uint8Array(e.target.result);

          inflator.push(view, true);
          if (inflator.err) {
            reject(inflator.err);
          }

          var infBlob = new Blob([inflator.result]);

          //Read raw text entry
          var rawText = [],
            verseStart = 0,
            verseEnd = 0,
            z = 0,
            gotIntro = false;

          while (z < inVList.length) {
            if (inIntro && !gotIntro) {
              verseStart =
                inVList[z].chapter === 1
                  ? 0
                  : inPos[inVList[z].chapter - 2].startPos +
                    inPos[inVList[z].chapter - 2].length;
              verseEnd = startPos;
            } else {
              verseStart =
                startPos +
                inPos[inVList[z].chapter - 1].verses[inVList[z].verse - 1]
                  .startPos;
              verseEnd =
                verseStart +
                inPos[inVList[z].chapter - 1].verses[inVList[z].verse - 1]
                  .length;
            }

            const blob = infBlob.slice(verseStart, verseEnd);
            try {
              const text = await readBlobText(
                inVList,
                inEcoding,
                blob,
                inIntro && !gotIntro,
                z
              );
              rawText.push(text);
            } catch (error) {
              console.log({ error });
            }
            if (inIntro && !gotIntro) {
              gotIntro = true;
            } else {
              z++;
            }
          }
          resolve(rawText);
        }
      };
    }
  });
}

const zText = {
  getRawEntry,
};

export default zText;
