import { Raw, BookPos, DictIndex } from './types';

async function readBlobText(
  inVList: BookPos[],
  inEcoding: string,
  blob: Blob,
  z: number
) {
  return new Promise<Raw>((resolve, reject) => {
    var textReader = new FileReader();
    if (!inEcoding) {
      textReader.readAsText(blob, 'CP1252');
    } else {
      textReader.readAsText(blob, inEcoding);
    }
    textReader.onload = async function (e) {
      if (e.target && e.target.result && typeof e.target.result === 'string') {
        resolve({
          text: e.target.result,
          osisRef: inVList[z].osisRef,
          verse: inVList[z].verse,
        });
      }
      reject();
    };
  });
}

async function getRawEntry(
  inBlob: Blob,
  inPos: DictIndex, // different from zText => BookIndex[]
  inVList: BookPos[],
  inEcoding: string
) {
  return new Promise<Raw[]>(async (resolve, reject) => {
    var startPos = inPos.startPos,
      length = startPos + inPos.length,
      blob = inBlob.slice(startPos, length),
      rawText = [],
      z = 0;

    while (z < inVList.length) {
      try {
        const text = await readBlobText(inVList, inEcoding, blob, z);
        rawText.push(text);
      } catch (error) {
        console.log({ error });
      }
      z++;
    }
    resolve(rawText);
  });
}

const rawCom = {
  getRawEntry,
};

export default rawCom;
