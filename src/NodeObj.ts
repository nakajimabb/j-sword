import { str, zeroPadding } from './tools';

export interface NodeObj {
  tag: string;
  value: string;
  attrs: { [key: string]: string };
  children: NodeObj[];
}

export const createNodeObj = (node: Node): NodeObj => {
  let obj = createSelfNodeObj(node);
  node.childNodes.forEach((child) => {
    obj.children.push(createNodeObj(child));
  });
  return obj;
};

const createSelfNodeObj = (node: Node): NodeObj => {
  const attrs =
    node instanceof Element && node.attributes
      ? Object.assign(
          {},
          ...Array.from(node.attributes).map((attr) => ({
            [attr.name]: attr.nodeValue,
          }))
        )
      : {};
  return {
    tag: node.nodeName,
    value: str(node.nodeValue),
    attrs: attrs,
    children: [],
  };
};

export const shapeLemma = (lemma: string, lang: string) => {
  let reg = /([GH])(\d+)/;
  let m = lemma.match(reg);
  if (m) {
    return m[1] && m[2] ? m[1] + zeroPadding(+m[2], 4) : '';
  }
  reg = /(\d+)/;
  m = lemma.match(reg);
  if (m) {
    const prefix = lang === 'he' ? 'H' : 'G';
    return m[1] ? prefix + zeroPadding(+m[1], 4) : '';
  }
  return '';
};
