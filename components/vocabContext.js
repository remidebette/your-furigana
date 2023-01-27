import { createContext } from 'react';


const VocabContext = createContext({
    vocab: {},
    dispatchVocab: () => { }
});


function vocabReducer(vocab, action) {
    switch (action.type) {
        case 'reset': {
            return { ...action.vocab }
        }
        case 'add': {
            return (action.char in vocab) ? { ...vocab, [action.char]: vocab[action.char] + ";" + action.reading } : { ...vocab, [action.char]: action.reading };
        }
        case 'delete': {
            const readings = vocab[action.char].split(";")
            const newReadings = readings.filter((element) => { element === action.reading })
            return { ...vocab, [action.char]: newReadings.join(";") }
        }
        default: {
            throw Error('Unknown action: ' + action.type);
        }
    }
}


export { VocabContext, vocabReducer }