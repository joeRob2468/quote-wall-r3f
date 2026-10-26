// Lets UI outside the canvas (e.g. the add-quote dialog) put a quote on the
// screens. Screens subscribes; requests with no subscriber are dropped.
type Listener = (quoteId: string) => void;

const listeners = new Set<Listener>();

export const showQuote = (quoteId: string) => {
  listeners.forEach((listener) => listener(quoteId));
};

export const onShowQuote = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
