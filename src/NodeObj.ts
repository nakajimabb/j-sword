import { str } from './tools';

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
