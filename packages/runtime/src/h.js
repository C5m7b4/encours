import { withoutNulls, cleanChildren } from './utils/arrays';

export const DOM_TYPES = {
  TEXT: 'text',
  ELEMENT: 'element',
  FRAGMENT: 'fragment',
};

export function createElement(tag, props = {}, ...children) {
  const childNodesWithoutNulls = withoutNulls(cleanChildren(children));
  return {
    tag,
    props,
    children: mapTextNodes(childNodesWithoutNulls),
    type: DOM_TYPES.ELEMENT,
  };
}

function mapTextNodes(children) {
  return children.map((child) =>
    typeof child === 'string' || typeof child === 'number'
      ? hString(child)
      : child,
  );
}

export function hString(str) {
  return { type: DOM_TYPES.TEXT, value: str };
}

export function extractChildren(vdom) {
  if (vdom.children == null) {
    return [];
  }
  const children = [];
  for (const child of vdom.children) {
    if (child.type === DOM_TYPES.FRAGMENT) {
      children.push(...extractChildren(child, children));
    } else {
      children.push(child);
    }
  }
  return children;
}
