import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";


const kuroshiro = new Kuroshiro();
const analyzer = new KuromojiAnalyzer({dictPath: "/data/dict"});

let is_dict_ready = false;

const initKuroshiro = async () => {
    console.log("Initializing kuroshiro")
    await kuroshiro.init(analyzer);
    is_dict_ready = true;
    console.log("Kuroshiro is ready")
}



if (typeof window !== 'undefined'){
    initKuroshiro()
}


export {kuroshiro, is_dict_ready}