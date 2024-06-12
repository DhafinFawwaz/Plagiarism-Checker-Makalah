import { argv } from "process";
import dataClean from "./json/data-clean.json" with { type: "json"};
import dataRaw from "./json/data-raw.json" with { type: "json"};
import notFound from "./json/not-found.json" with { type: "json"};

async function main(...args){
    console.log(dataClean.length);
    
    const index = args[2];
    if(index){
        if(index < dataClean.length){
            if(argv[3] === "raw") console.log(dataRaw[index]);
            else console.log(dataClean[index]);
        } else if(index >= dataClean.length){
            console.log("Index out of range");
        }
    }
}

main(...process.argv)