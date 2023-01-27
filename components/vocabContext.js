import { createContext } from 'react';

export const VocabContext = createContext({
    vocab: {},
    dispatchVocab: () => {}
});
