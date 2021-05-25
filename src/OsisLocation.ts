import Sword from './sword/Sword';
import { OsisLocation } from './sword/types';
import { parseWordTarget } from './sword/parseTarget';

export function UnionOsisRefs(refs1: OsisLocation, refs2: OsisLocation) {
  const refs = { ...refs1 };
  Object.entries(refs2).forEach(([book, cvRef]) => {
    if (refs[book]) {
      Object.entries(cvRef).forEach(([chap, vRef]) => {
        if (refs[book][+chap]) {
          Object.entries(vRef).forEach(([vers, cnt]) => {
            if (refs[book][+chap][+vers]) {
              refs[book][+chap][+vers] =
                Number(refs[book][+chap][+vers]) + Number(cnt);
            } else {
              refs[book][+chap][+vers] = cnt;
            }
          });
        } else {
          refs[book][+chap] = vRef;
        }
      });
    } else {
      refs[book] = cvRef;
    }
  });
  return refs;
};

export function IntersecOsisRefs (refs1: OsisLocation, refs2: OsisLocation)  {
  console.log({ refs1, refs2 });
  const refs: OsisLocation = {};
  Object.entries(refs2).forEach(([book, cvRef]) => {
    if (refs1[book]) {
      Object.entries(cvRef).forEach(([chap, vRef]) => {
        if (refs1[book][+chap]) {
          Object.entries(vRef).forEach(([vers, cnt]) => {
            if (refs1[book][+chap][+vers]) {
              if (!refs[book]) refs[book] = {};
              if (!refs[book][+chap]) refs[book][+chap] = {};
              refs[book][+chap][+vers] =
                Number(refs1[book][+chap][+vers]) + Number(cnt);
            }
          });
        }
      });
    }
  });
  return refs;
};

export async function getOsisLocations (bibles: { [key: string]: Sword }, search: string) {
  const res = parseWordTarget(search);
  if (res) {
    const { lemmas, separator } = res;
    const tasks = Object.entries(bibles).map(async ([modname, bible]) => {
      let loc: OsisLocation | null = null;
      for await (const lemma of lemmas) {
        const refers = await bible.getReference(lemma);
        if (refers) {
          if (loc) {
            if (separator === ',') loc = UnionOsisRefs(loc, refers);
            else loc = IntersecOsisRefs(loc, refers);
          } else {
            loc = refers;
          }
        }
      }
      return { modname, loc };
    });
    const result = await Promise.all(tasks);
    let locations: { [modname: string]: OsisLocation } = {};
    result.forEach(({ modname, loc }) => {
      if (loc) locations[modname] = loc;
    });
    return locations;
  }
};
