import { DOM_TYPES } from '../h';
import { setAttributes } from '../utils/attributes';
import { extractChildren } from '../utils/arrays';
import { destroyDom } from './destroy-dom';
import { Dispatcher } from '../dispatcher';
import { patchDom } from './patch-dom';

export function createApp({ state, view, reducers = {} }) {
  let parentEl = null;
  let vdom = null;

  const dispatcher = new Dispatcher();
  const subscriptions = [dispatcher.afterEveryCommand(renderApp)];

  function emit(eventName, payload) {
    dispatcher.dispatch(eventName, payload);
  }

  for (const actionName in reducers) {
    const reducer = reducers[actionName];

    const subs = dispatcher.subscribe(actionName, (payload) => {
      state = reducer(state, payload);
    });
    subscriptions.push(subs);
  }

  function renderApp() {
    // if (vdom) {
    //   destroyDom(vdom);
    // }
    const newVdom = view(state, emit);
    //render(vdom, parentEl);
    vdom = patchDom(vdom, newVdom, parentEl);
  }

  return {
    mount(_parentEl) {
      parentEl = _parentEl;
      //renderApp();
      vdom = view(state, emit);
      render(vdom, parentEl);
    },
    unmount() {
      destroyDom(vdom);
      vdom = null;
      subscriptions.forEach((unsubscribe) => unsubscribe());
    },
  };
}

export function render(vdom, parentEl) {
  // for some reason we are getting a master array with all the children
  // inside of that base array
  if (vdom.children.length === 1 && Array.isArray(vdom.children[0])) {
    vdom.children = vdom.children[0];
  }
  mountDom(vdom, parentEl);
}

export function mountDom(vdom, parentEl) {
  switch (vdom.type) {
    case DOM_TYPES.TEXT:
      createTextNode(vdom, parentEl);
      break;
    case DOM_TYPES.ELEMENT:
      createElementNode(vdom, parentEl);
      break;
    default:
      throw new Error(`DOM type ${vdom.type} is not currently supported`);
  }
}

function createTextNode(vdom, parentEl, index) {
  const { value } = vdom;

  const textNode = document.createTextNode(value);
  vdom.el = textNode;

  insert(textNode, parentEl, index);
}

function createElementNode(vdom, parentEl, index) {
  const { tag, props } = vdom;
  let { children } = vdom;

  children = extractChildren(children);

  const element = document.createElement(tag);
  addProps(element, props, vdom);
  vdom.el = element;

  children.forEach((child) => mountDom(child, element));
  insert(element, parentEl, index);
}

function addProps(el, props = {}, vdom) {
  if (!props) return;
  const { ...attrs } = props;
  setAttributes(el, attrs, vdom);
}

function insert(el, parentEl, index) {
  // If index is null or undefined, simply append.
  // Note the usage of == instead of ===.
  if (index == null) {
    parentEl.append(el);
    return;
  }
  if (index < 0) {
    throw new Error(`Index must be a positive integer, got ${index}`);
  }
  const children = parentEl.childNodes;
  if (index >= children.length) {
    parentEl.append(el);
  } else {
    parentEl.insertBefore(el, children[index]);
  }
}

export function mountDOM(vdom, parentEl, index) {
  switch (vdom.type) {
    case DOM_TYPES.TEXT: {
      createTextNode(vdom, parentEl, index);
      break;
    }
    case DOM_TYPES.ELEMENT: {
      createElementNode(vdom, parentEl, index);
      break;
    }
    default: {
      throw new Error(`Can't mount DOM of type: ${vdom.type}`);
    }
  }
}
