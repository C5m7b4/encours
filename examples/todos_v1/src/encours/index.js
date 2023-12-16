function withoutNulls(arr) {
  return arr.filter((item) => item != null);
}
function extractChildren(children) {
  if (children.length === 1 && Array.isArray(children[0])) {
    return children[0];
  }
  return children;
}
function cleanChildren(children) {
  if (Array.isArray(children) && children.length === 1) {
    return cleanChildren(children[0]);
  } else if (Array.isArray(children)) {
    return children;
  } else if (typeof children === "string") {
    children = children.trim();
    return [children];
  } else if (typeof children === "object") {
    return [children];
  }
  const childs = [].concat(...children);
  return childs;
}

const DOM_TYPES = {
  TEXT: "text",
  ELEMENT: "element",
  FRAGMENT: "fragment",
};
function createElement(tag, props = {}, ...children) {
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
    typeof child === "string" || typeof child === "number"
      ? hString(child)
      : child
  );
}
function hString(str) {
  return { type: DOM_TYPES.TEXT, value: str };
}

function addEventListener(eventName, handler, el) {
  el.addEventListener(eventName, handler);
  return handler;
}
function addEventListeners(listeners = [], el) {
  const addedListeners = {};
  listeners.forEach((event) => {
    const { eventName, value: handler } = event;
    const addedListener = addEventListener(eventName, handler, el);
    addedListeners[eventName] = addedListener;
  });
  return addedListeners;
}
function removeEventListeners(listeners = {}, el) {
  Object.entries(listeners).forEach(([eventName, handler]) => {
    el.removeEventListener(eventName, handler);
  });
}

function setAttributes(el, attrs, vdom) {
  const {
    class: classNameShort,
    className: classNameLong,
    style,
    ...otherAttrs
  } = attrs;
  if (classNameShort) {
    setClass(el, classNameShort);
  }
  if (classNameLong) {
    setClass(el, classNameLong);
  }
  if (style) {
    if (typeof style === "string") {
      el.setAttribute("style", style);
    } else {
      Object.entries(style).forEach(([prop, value]) => {
        setStyle(el, prop, value);
      });
    }
  }
  for (const [name, value] of Object.entries(otherAttrs)) {
    const events = [];
    if (name.slice(0, 2) === "on") {
      const eventName = name.toLowerCase().slice(2);
      events.push({ eventName, value });
    } else {
      setAttributes(el, name, value);
    }
    vdom.listeners = addEventListeners(events, el);
  }
}
function setClass(el, className) {
  el.className = "";
  if (typeof className === "string") {
    el.className = className;
  }
  if (Array.isArray(className)) {
    el.classList.add(...className);
  }
}
function setStyle(el, name, value) {
  el.style[name] = value;
}

function destroyDom(vdom) {
  const { type } = vdom;
  switch (type) {
    case DOM_TYPES.TEXT:
      removeTextNode(vdom);
      break;
    case DOM_TYPES.ELEMENT:
      removeElementNode(vdom);
      break;
    default:
      throw new Error(`DOM type ${type} is not supported yet`);
  }
}
function removeTextNode(vdom) {
  const { el } = vdom;
  el.remove();
}
function removeElementNode(vdom) {
  const { el, children, listeners } = vdom;
  el.remove();
  children.forEach(destroyDom);
  if (listeners) {
    removeEventListeners(listeners, el);
    delete vdom.listeners;
  }
}

class Dispatcher {
  #subs = new Map();
  #afterHandlers = [];
  subscribe(commandName, handler) {
    if (!this.#subs.has(commandName)) {
      this.#subs.set(commandName, []);
    }
    const handlers = this.#subs.get(commandName);
    if (handlers.includes(handler)) {
      return () => {};
    }
    handlers.push(handler);
    return () => {
      const idx = handlers.indexOf(handler);
      handlers.splice(idx, 1);
    };
  }
  dispatch(commandName, payload) {
    if (this.#subs.has(commandName)) {
      this.#subs.get(commandName).forEach((handler) => handler(payload));
    } else {
      console.warn(`No handlers for the command ${commandName}`);
    }
    this.#afterHandlers.forEach((handler) => handler(commandName, payload));
  }
  afterEveryCommand(handler) {
    this.#afterHandlers.push(handler);
    return () => {
      const idx = this.#afterHandlers.indexOf(handler);
      this.#afterHandlers.splice(idx, 1);
    };
  }
}

function createApp({ state, view, reducers = {} }) {
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
function render(vdom, parentEl) {
  if (vdom.children.length === 1 && Array.isArray(vdom.children[0])) {
    vdom.children = vdom.children[0];
  }
  mountDom(vdom, parentEl);
}
function mountDom(vdom, parentEl) {
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

const encours = {
  createElement,
  createApp,
};

export { encours };
