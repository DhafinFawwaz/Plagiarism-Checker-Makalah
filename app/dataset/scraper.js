import scrapeLinks from "./json/scrape-links.json" with { type: "json"};
import { parse } from "node-html-parser";
import fetch from "node-fetch";
import https from "https";
import PDFParser from "pdf2json";
import fs from "fs";

/**
 * @typedef {Object} Paper
 * @property {string} title - The title of the object.
 * @property {string} href - The hyperlink reference.
 * @property {string} content - The content of the object.
 */

const agent = new https.Agent({
  rejectUnauthorized: false
});


/**
 * Scrapes the links from the given URL.
 * @param {string} url - The URL to scrape.
 * @returns {Promise<Paper[]>} - The list of links.
 */
async function getAllLinks(url) {
    try{
        const response = await fetch(url, {agent: agent});
        if(!response.ok) throw new Error(`Failed to fetch page: ${response.statusText}`);
        const body = await response.text();
        const html = parse(body);
        
        /** @type {Paper[]} */
        const links = [];
        
        // Pop latest url
        const parts = url.split("/");
        parts.pop();
        const parentUrl = parts.join("/");
        
        html.querySelectorAll("a").forEach(a => {
            const href = a.getAttribute("href");
            if(href && href.endsWith(".pdf")) links.push({
                href: parentUrl+"/"+href,
                title: a.textContent.trim(),
                content: ""
            });
        });
        return links;
    } catch (error) {
        console.error('Error:', error.message);
    }
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

/**
 * Extracts the text content from a PDF file by its URL.
 * @param {string} url 
 * @returns 
 */
async function extractPdfTextContent(url) {
    try {
        const response = await fetch(url, {agent: agent});
        if (!response.ok) throw new Error(`Failed to fetch PDF, ${response.statusText}: ${url}`);
        
        const buffer = await response.arrayBuffer();
        const pdfParser = new PDFParser(null, 1);
        pdfParser.parseBuffer(buffer);
        pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
        
        let content = "";
        let ready = false;
        pdfParser.on("pdfParser_dataReady", pdfData => {
            content = pdfParser.getRawTextContent();
            content = clean(content);
            ready = true;
        });
        while(!ready) await wait(100);

        return content
    } catch (error) {
        console.log('\x1b[31m\n%s\x1b[0m', error.message);
        return "";
    }
}

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveToFile(data){
    fs.writeFileSync("app/dataset/json/data-raw-clean.json", JSON.stringify(data));
}

/**
 * @param {Promise[]} promises 
 * @param {Function} tickCallback 
 * @returns 
 */
async function progressPromiseAll(promises, concurencyLimit, tickCallback) {
    var len = promises.length;
    var progress = 0;
    
    // generate empty array
    var promiseResults = [];
    for(let i = 0; i < len; i++) promiseResults.push(null);

    function tick(promise, index) {
        return promise.then(function (result) {
            promiseResults[index] = result;
            progress++;
            tickCallback(progress, len);
        });
    }

    let current = []
    let taskIndexes = []
    for(let i = 0; i < len; i++) {
        current.push(tick(promises[i], i));
        taskIndexes.push(i);
        if(current.length >= concurencyLimit || i == len-1){
            console.log('Processing Concurrent Task: %d - %d', taskIndexes[0], taskIndexes[taskIndexes.length-1]);
            taskIndexes = [];
            await Promise.all(current);
            current = [];
        }
    }

    return promiseResults;
}


// main
async function main(){
    // const data = [];
    // const totalLinks = scrapeLinks.length;
    // let count = 0;
    // for(const url of scrapeLinks){
    //     count++;
    //     console.log('\x1b[32m\n(%d/%d) %s\x1b[0m', count, totalLinks, url);
        
    //     const pdfLinks = await getAllLinks(url);
    //     const pdfLinksCount = pdfLinks.length;
    //     console.log('\x1b[33m%d links\x1b[0m', pdfLinksCount);
    //     let pdfCount = 0;
    //     const startTime = performance.now();
    //     for(const link of pdfLinks){
    //         pdfCount++;
    //         const pdfContent = await extractPdfTextContent(link.href);
    //         const duration = performance.now() - startTime;
    //         const pdfLeft = pdfLinksCount - pdfCount;
    //         const timeLeft = (duration / pdfCount) * pdfLeft;
    //         const formattedTime = new Date(timeLeft).toISOString().substr(11, 8);

    //         link.content = pdfContent;
    //         data.push(link);
    //         saveToFile(data);
    //         console.log("(%d/%d) Approximated Time Left: %s", pdfCount, pdfLinksCount, formattedTime);
    //     }
    // }

    // // Check for empty content
    // console.log('\x1b[31m\nEmpty/Error:\x1b[0m');
    // for(const link of data){
    //     if(link.content === "") console.log('\x1b[31m%s\x1b[0m', link.href);
    // }

    // Parallel version, but let's not get blocked
    const promises = scrapeLinks.map(url => getAllLinks(url));
    const allLinks = await Promise.all(promises);
    const allPdfLinks = allLinks.flat();
    const promises2 = allPdfLinks.map(link => extractPdfTextContent(link.href));
    const startTime = performance.now();
    progressPromiseAll(promises2, 4, (completed, total) => {
        const duration = performance.now() - startTime;
        const pdfLeft = total - completed;
        const timeLeft = (duration / completed) * pdfLeft;
        const formattedTime = new Date(timeLeft).toISOString().substr(11, 8);
        console.log("(%d/%d) Approximated Time Left: %s", completed, total, formattedTime);
    }).then(results => {
        console.log('\x1b[32m\nDone!\x1b[0m');
        console.log('\x1b[33mWriting to file...\x1b[0m');
        
        /** @type {Paper[]} */
        const data = [];
        for(let i=0; i<allPdfLinks.length; i++){
            allPdfLinks[i].content = results[i];
            data.push(allPdfLinks[i]);
        }
        saveToFile(data);

            // Check for empty content
            console.log('\x1b[31m\nEmpty/Error:\x1b[0m');
            for(const link of data){
                if(link.content === "") console.log('\x1b[31m%s\x1b[0m', link.href);
            }

        console.log('\x1b[32m\nScrapping finished!\x1b[0m');
    });
}

main();