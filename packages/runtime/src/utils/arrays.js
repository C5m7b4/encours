export function withoutNulls(arr) {
  return arr.filter((item) => item != null);
}

export function extractChildren(children) {
  if (children.length === 1 && Array.isArray(children[0])) {
    return children[0];
  }
  return children;
}

export function cleanChildren(children) {
  if (Array.isArray(children) && children.length === 1) {
    return cleanChildren(children[0]);
  } else if (Array.isArray(children)) {
    return children;
  } else if (typeof children === 'string') {
    children = children.trim();
    return [children];
  } else if (typeof children === 'object') {
    return [children];
  }
  const childs = [].concat(...children);
  return childs;
}
