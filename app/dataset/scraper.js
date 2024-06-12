import scrapeLinks from "./json/scrape-links.json" with { type: "json"};
import { parse } from "node-html-parser";
import fetch from "node-fetch";
import https from "https";
import PDFParser from "pdf2json";
import fs from "fs";
import dataRaw from "./json/data-raw.json" with { type: "json"};
import notFound from "./json/not-found.json" with { type: "json"};

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
 * Extracts the text content from a PDF file by its URL.
 * @param {string} url 
 * @returns 
 */
async function extractFetchPDF(url) {
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
            ready = true;
        });
        while(!ready) await wait(100);

        return content
    } catch (error) {
        console.log('\x1b[31m\n%s\nreturning empty string\x1b[0m', error.message);

        return "";
    }
}


async function fetchPDFBuffer(url) {
    try {
        const response = await fetch(url, {agent: agent});
        if (!response.ok) throw new Error(`Failed to fetch PDF, ${response.statusText}: ${url}`);
        
        const buffer = await response.arrayBuffer();
        return buffer;
    } catch (error) {
        console.log('\x1b[31m%s\x1b[0m', error.message);
        return null;
    }
}

/**
 * @param {ArrayBuffer} buffer 
 * @returns 
 */
async function extractPdfTextContentFromBuffer(buffer) {
    if(!buffer) return "";
    try {
        const pdfParser = new PDFParser(null, 1);
        pdfParser.parseBuffer(buffer);
        
        let content = "";
        let ready = false;

        const startTime = performance.now();
        
        pdfParser.on("pdfParser_dataError", errData => {
            console.log('\x1b[31m\n%s\nreturning empty string\x1b[0m', errData.parserError);
            ready = true;
        });
        
        pdfParser.on("pdfParser_dataReady", pdfData => {
            content = pdfParser.getRawTextContent();
            ready = true;
        });
        while(!ready) {
            if(performance.now() - startTime > 10000) {
                console.log('\x1b[31m\nTimeout: Took longer than 10s\nreturning empty string\x1b[0m');
                break;
            }
            await wait(100);
        }

        return content
    } catch (error) {
        console.log('\x1b[31m%s\nreturning empty string\x1b[0m', error.message);

        return "";
    }
}

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveToFile(data){
    fs.writeFileSync("app/dataset/json/data-raw.json", JSON.stringify(data));
}
async function saveNotFoundToFile(data){
    fs.writeFileSync("app/dataset/json/not-found.json", JSON.stringify(data));
}

// main
async function main(...args){
    process.removeAllListeners('warning')

    /** @type {Paper[]} */
    const data = [];
    const parentURLsPromises = scrapeLinks.map(url => getAllLinks(url));
    const allLinks = await Promise.all(parentURLsPromises);
    const allPdfLinks = allLinks.flat();
    console.log('Total PDFs:', allPdfLinks.length);

    const startTime = performance.now();
    const rateLimit = 16;
    let i = 0;

    /** @type {[{promise: Promise<ArrayBuffer>, index: number}]} */
    const currentPromises = [];
    while(i < allPdfLinks.length){
        currentPromises.push({ promise: fetchPDFBuffer(allPdfLinks[i].href), index: i });

        if(currentPromises.length === rateLimit || i === allPdfLinks.length - 1){
            const results = await Promise.all(currentPromises.map(p => p.promise));
            for (let j = 0; j < results.length; j++) {
                const { index } = currentPromises[j];
                const buffer = results[j];
                const content = await extractPdfTextContentFromBuffer(buffer);
                allPdfLinks[index].content = content;
                data.push(allPdfLinks[index]);
            }

            currentPromises.length = 0;

            const duration = performance.now() - startTime;
            const pdfLeft = allPdfLinks.length - i;
            const timeLeft = (duration / i) * pdfLeft;
            const formattedTime = new Date(timeLeft).toISOString().substr(11, 8);
            console.log("(%d/%d) Approximated Time Left: %s", i+1, allPdfLinks.length, formattedTime);
        }

        i++;
    }

    console.log("Total time taken: %s", new Date(performance.now() - startTime).toISOString().substr(11, 8));
    console.log("Wiriting to file...");
    
    dataRaw.push(...data);
    saveToFile(dataRaw);

    // Check for empty content
    console.log('\x1b[31m\nEmpty/Error List:\x1b[0m');
    const notFoundUrls = [];
    for(const link of data){
        if(link.content === "") {
            console.log('\x1b[31m%s\x1b[0m', link.href);
            notFoundUrls.push(link.href);
        }
    }

    notFound.push(...notFoundUrls);
    saveNotFoundToFile(notFound);
}

main(...process.argv);