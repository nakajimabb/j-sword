export const parseAttribute = (
  attr: Attr
): [string, string | { [key: string]: string }] => {
  if (attr.name && attr.value) {
    if (attr.value.indexOf(':') > 0) {
      const values = attr.value?.split(' ') || [];
      const values2 = values
        .map((value: string) => value.split(':'))
        .filter((strs: string[]) => strs.length >= 2)
        .map((strs: string[]) => ({ [strs[0]]: strs[1] }));
      const result = Object.assign({}, ...values2);
      return [attr.name, result];
    } else {
      return [attr.name, attr.value];
    }
  } else {
    return ['', {}];
  }
};

export const parseLemma = (attr: Attr, concordance = 'strong') => {
  const [name, value] = parseAttribute(attr);
  if (name === 'lemma') {
    const lemma = typeof value === 'string' ? value : value[concordance];
    if (lemma) {
      const reg = /([GH])(\d+)/;
      const m = lemma.match(reg);
      if (m && m[1] && m[2]) {
        return m[1] + ('0000' + +m[2]).slice(-4); // ４桁
      }
    }
  }
};
