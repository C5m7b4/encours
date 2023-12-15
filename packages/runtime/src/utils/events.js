export function addEventListener(eventName, handler, el) {
  el.addEventListener(eventName, handler);
  return handler;
}

export function addEventListeners(listeners = [], el) {
  const addedListeners = {};

  listeners.forEach((event) => {
    const { eventName, value: handler } = event;
    const addedListener = addEventListener(eventName, handler, el);
    addedListeners[eventName] = addedListener;
  });

  return addedListeners;
}

export function removeEventListeners(listeners = {}, el) {
  Object.entries(listeners).forEach(([eventName, handler]) => {
    el.removeEventListener(eventName, handler);
  });
}
