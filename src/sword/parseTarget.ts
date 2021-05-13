export function parseBibleTarget(search: string) {
  const m = search.match(/^(\w+)\.(\d+)(:([\d-,]+))*$/);
  if(m) {
    return {
        book: m[1],
        chapter: +m[2],
        verse: m[4],
    }
  }
}

export function parseWordTarget(search: string) {
  const m = search.match(/^[GH]\d+(([,&])[GH]\d+)*$/);
  if(m) {
    return {lemmas: search.split(m[2]), separator: m[2]};
  }
}

