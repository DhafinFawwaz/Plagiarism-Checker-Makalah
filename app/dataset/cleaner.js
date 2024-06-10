import dataRaw from "./json/data-raw.json" with { type: "json"};
import fs from "fs";

async function saveToFile(data){
    fs.writeFileSync("app/dataset/json/data-clean.json", JSON.stringify(data));
}

/**
 * Remove \r, \r
 * if there are multiple spaces, replace them with a single space
 * Remove page break like ----------------Page (5) Break----------------
 * @param {string} content 
 * @returns {string}
 */
function clean(content) {
    content = content.replace(/\r/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ');
    content = content.replace(/----------------Page \(\w+\) Break----------------/g, '');
    return content;
}

for(let i = 0; i < dataRaw.length; i++){
    dataRaw[i].content = clean(dataRaw[i].content);
    dataRaw[i].title = clean(dataRaw[i].title);
}

saveToFile(dataRaw);