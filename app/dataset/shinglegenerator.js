import dataClean1 from "./json/data-clean-chunk-1.json" with { type: "json"};
import dataClean2 from "./json/data-clean-chunk-2.json" with { type: "json"};
import fs from "fs";

async function saveToFile(data, path){
    fs.writeFileSync(path, "[" + data.map(el => JSON.stringify(el)).join(",") + "]");
}

function shingles(text, n){
    let shingles = [];
    const size = text.length - n + 1;
    for(let i = 0; i < size; i++){
        shingles.push(text.slice(i, i+n));
    }
    return shingles;
}

const start = performance.now();
for(let i = 0; i < dataClean1.length; i++){
    dataClean1[i] = {
        href: dataClean1[i].href,
        title: dataClean1[i].title,
        shingles: shingles(dataClean1[i].content, 5)
    };
}
for(let i = 0; i < dataClean2.length; i++){
    dataClean2[i] = {
        href: dataClean2[i].href,
        title: dataClean2[i].title,
        shingles: shingles(dataClean2[i].content, 5)
    };
}
console.log(performance.now() - start);

saveToFile(dataClean1, "app/dataset/json/data-preprocessed-chunk-1.json");
saveToFile(dataClean2, "app/dataset/json/data-preprocessed-chunk-2.json");