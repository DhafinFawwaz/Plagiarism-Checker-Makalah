import scrapeLinks from "./json/scrape-links.json" with { type: "json"};
import { parse } from "node-html-parser";
import fetch from "node-fetch";
import fs from "fs";
import https from "https";


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


async function downloadPDF(url) {
    try {
        const response = await fetch(url, {agent: agent});
        if (!response.ok) throw new Error(`Failed to fetch PDF, ${response.statusText}: ${url}`);
        // write to file in ./pdf/<filename>.pdf
        const pdf = await response.arrayBuffer();
        const parts = url.split("/");
        const filename = parts[parts.length - 1];

        fs.writeFileSync(`app/dataset/pdf/${filename}`, Buffer.from(pdf));
    } catch (error) {
        console.log('\x1b[31m\n%s\x1b[0m', error.message);
        return null;
    }
}


async function main() {
    const parentURLsPromises = scrapeLinks.map(url => getAllLinks(url));
    const allLinks = await Promise.all(parentURLsPromises);
    const allPdfLinks = allLinks.flat();
    console.log('Total PDFs:', allPdfLinks.length);

    // Download all PDFs
    const startTime = performance.now();
    const rateLimit = 16;
    let i = 0;

    /** @type {[{promise: Promise<ArrayBuffer>, index: number}]} */
    const currentPromises = [];
    while(i < allPdfLinks.length){
        currentPromises.push(downloadPDF(allPdfLinks[i].href));

        if(currentPromises.length === rateLimit || i === allPdfLinks.length - 1){
            await Promise.all(currentPromises);
            currentPromises.length = 0;

            const duration = performance.now() - startTime;
            const pdfLeft = allPdfLinks.length - i;
            const timeLeft = (duration / i) * pdfLeft;
            const formattedTime = new Date(timeLeft).toISOString().substr(11, 8);
            console.log("(%d/%d) Approximated Time Left: %s", i+1, allPdfLinks.length, formattedTime);
        }

        i++;
    }
}

main();