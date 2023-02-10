import { createContext } from 'react';


const VocabContext = createContext({
    vocab: {},
    csv: "",
    dispatch: () => { }
});


export { VocabContext }