import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';
import { findPlagiarism } from './solver';
import { loadDataClean } from './data-cache';

export async function POST(req: Request) {
    const file = await req.formData();
    const pdfFile = file.get('file') as File;
    const pdfBuffer = await pdfFile.arrayBuffer();

    const content = await extractPdfTextContentFromBuffer(Buffer.from(pdfBuffer));
    if(!content || content === "") return NextResponse.json({ error: "Not a valid pdf file!" });
    const dataClean = loadDataClean();
    
    const result = findPlagiarism({content: content, title: pdfFile.name, href: ""}, dataClean);
    return NextResponse.json(result);
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