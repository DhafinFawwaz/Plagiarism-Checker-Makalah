import dataClean from './json/data-clean.json' with { type: "json"};
import fs from 'fs';

const split1 = [];
const split2 = [];

const halfLength = Math.floor(dataClean.length/2);
for(let i = 0; i < halfLength; i++){
    split1.push(dataClean[i]);
}

for(let i = halfLength; i < dataClean.length; i++){
    split2.push(dataClean[i]);
}


fs.writeFileSync("app/dataset/json/data-clean-chunk-1.json", JSON.stringify(split1));
fs.writeFileSync("app/dataset/json/data-clean-chunk-2.json", JSON.stringify(split2));