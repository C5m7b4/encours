import { addEventListeners } from './events';

export function setAttributes(el, attrs, vdom) {
  // we need to check for class or className
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
    if (typeof style === 'string') {
      el.setAttribute('style', style);
    } else {
      Object.entries(style).forEach(([prop, value]) => {
        setStyle(el, prop, value);
      });
    }
  }

  for (const [name, value] of Object.entries(otherAttrs)) {
    const events = [];
    if (name.slice(0, 2) === 'on') {
      const eventName = name.toLowerCase().slice(2);
      events.push({ eventName, value });
    } else {
      setAttribute(el, name, value);
    }

    vdom.listeners = addEventListeners(events, el);
  }
}

function setClass(el, className) {
  el.className = '';

  if (typeof className === 'string') {
    el.className = className;
  }

  if (Array.isArray(className)) {
    el.classList.add(...className);
  }
}

export function setStyle(el, name, value) {
  el.style[name] = value;
}

export function removeStyle(el, name) {
  el.style[name] = null;
}

export function setAttribute(el, name, value) {
  if (value === null) {
    removeAttribute(el, name);
  } else if (name.startsWith('data-')) {
    el.setAttribute(name, value);
  } else {
    el[name] = value;
  }
}

export function removeAttribute(el, name) {
  el[name] = null;
  el.removeAttribute(name);
}
