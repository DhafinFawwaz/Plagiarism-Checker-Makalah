import type { NextApiRequest, NextApiResponse } from 'next'
import { NextResponse } from 'next/server';
import { PlagiarizeResult } from '@/app/page';
import PDFParser from 'pdf2json';
import { findPlagiarism } from './solver';
import { Paper } from '@/app/paper/paper';
import { loadDataClean } from './data-cache';
import {PdfReader} from 'pdfreader';

export async function POST(req: Request) {
    const file = await req.formData();
    const pdfFile = file.get('file') as File;
    const pdfBuffer = await pdfFile.arrayBuffer();

    const content = await extractPdfTextContentFromBuffer(Buffer.from(pdfBuffer));
    if(!content || content === "") return NextResponse.json({ error: "Not a valid pdf file!" });
    const dataClean = loadDataClean();
    console.log(dataClean[5000].title)
    
    const result = findPlagiarism(content, dataClean);
    return NextResponse.json(result);
}

async function extractPDF(pdfBuffer: Buffer){
    // const pdf = require('pdf-parse');
    // pdf(pdfBuffer).then((data: any) => {
    //     console.log(data.text);
    // });

    // new PdfReader({}).parseBuffer(pdfBuffer, (err, item) => {
    //     if (err) console.error("error:", err);
    //     else if (!item) console.warn("end of buffer");
    //     else if (item.text) console.log(item.text);
    // });

    // var pdfText = "";
    // new PdfReader({}).parseBuffer(pdfBuffer, (err, item) => {
    //     console.log(item?.text)
    //     pdfText += item?.text;
    // });
    // console.log(pdfText);
    

}


async function extractPdfTextContentFromBuffer(buffer: Buffer) {
    if(!buffer) return "";
    try {
        const pdfParser = new PDFParser(null, true);
        pdfParser.parseBuffer(buffer);
        
        let content = "";
        let ready = false;
        
        pdfParser.on("pdfParser_dataError", errData => {
            console.log('\x1b[31m\n%s\nreturning empty string\x1b[0m', errData.parserError);
            ready = true;
        });
        
        pdfParser.on("pdfParser_dataReady", pdfData => {
            content = pdfParser.getRawTextContent();

            // content = pdfData.Pages.reduce((acc, page) => {
            //     const pageContent = page.Texts.map(text => {
            //         return decodeURIComponent(text.R[0].T);
            //     }).join(' ');
            //     return acc + pageContent;
            // }, '');

            ready = true;
        });
        while(!ready) await wait(100);

        return content
    } catch (error: Error | any) {
        console.log('\x1b[31m\n%s\nreturning empty string\x1b[0m', error.message);

        return "";
    }
}

async function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}