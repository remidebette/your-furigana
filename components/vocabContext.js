import { createContext } from 'react';
import { defaultDict } from "../utils/const";


const VocabContext = createContext({
    vocab: {},
    csv: defaultDict,
    dispatch: () => { }
});


export { VocabContext }