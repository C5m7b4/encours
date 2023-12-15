import { DOM_TYPES } from '../h';
import { setAttributes } from '../utils/attributes';
import { extractChildren } from '../utils/arrays';
import { destroyDom } from './destroy-dom';
import { Dispatcher } from '../dispatcher';

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
    if (vdom) {
      destroyDom(vdom);
    }
    vdom = view(state, emit);
    render(vdom, parentEl);
  }

  return {
    mount(_parentEl) {
      parentEl = _parentEl;
      renderApp();
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

function createTextNode(vdom, parentEl) {
  const { value } = vdom;

  const textNode = document.createTextNode(value);
  vdom.el = textNode;

  parentEl.append(textNode);
}

function createElementNode(vdom, parentEl) {
  const { tag, props } = vdom;
  let { children } = vdom;

  children = extractChildren(children);

  const element = document.createElement(tag);
  addProps(element, props, vdom);
  vdom.el = element;

  children.forEach((child) => mountDom(child, element));
  parentEl.append(element);
}

function addProps(el, props = {}, vdom) {
  if (!props) return;
  const { ...attrs } = props;
  setAttributes(el, attrs, vdom);
}
