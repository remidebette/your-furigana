import { createContext } from 'react';
import { defaultDict } from "../utils/const";


const VocabContext = createContext({
    vocab: {},
    csv: defaultDict,
    dispatch: () => { }
});


function vocabReducer(context, action) {
    switch (action.type) {
        case 'from-vocab': {
            return { vocab: {...action.vocab}, csv: context.csv }
        }
        case 'from-csv': {
            return { vocab: { ...context.vocab }, csv: action.csv }
        }
        case 'add': {
            const newVocab = (action.char in context.vocab) ? { ...context.vocab, [action.char]: context.vocab[action.char] + ";" + action.reading } : { ...context.vocab, [action.char]: action.reading };
            return { vocab: newVocab, csv: context.csv }
        }
        case 'delete': {
            const readings = context.vocab[action.char].split(";")
            const newReadings = readings.filter((element) => { element === action.reading })
            const newVocab = { ...context.vocab, [action.char]: newReadings.join(";") }
            return { vocab: newVocab, csv: context.csv }
        }
        default: {
            throw Error('Unknown action: ' + action.type);
        }
    }
}


export { VocabContext, vocabReducer }