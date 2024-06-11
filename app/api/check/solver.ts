import { PlagiarizeResult } from '@/app/page';
import { Paper } from '@/app/paper/paper';
import { PlagiarizedPaper } from '@/app/paper/plagiarized-paper';
import { shingles } from './algorithm';

const N_GRAMS = 3;
  
// content is still not clean
export function findPlagiarism(paper: Paper, data: Paper[]): PlagiarizeResult{
    const startTime = performance.now();
    const dirtyContent = paper.content;
    const content = clean(dirtyContent);
    
    const plagiarizedPaper = getPlagiarizedPaper(content, data);
    const result: PlagiarizeResult = {
        selectedPaper: { title: paper.title, href: paper.href, content: content},
        plagiarizedPaper: plagiarizedPaper,
        percentage: calculateAllPercentage(paper.content, plagiarizedPaper),
        executionTime: 0, // must be set at the end to ensure the correct time
    };

    result.executionTime = performance.now() - startTime;
    return result;
}


function getPlagiarizedPaper(content: string, data: Paper[]){
    const plagiarizedPaper: PlagiarizedPaper[] = [];
    
    const len = data.length; // dont forget change to this
    for(let i = 2216; i < 2217; i++){
        const plagiarizedContent = cleanDestruct(data[i].content);
        const userContent = cleanDestruct(content);
        const similiarTextList = getSimilarTextList(userContent, plagiarizedContent);
        if(similiarTextList.length === 0) continue;
        
        plagiarizedPaper.push({
            title: data[i].title,
            href: data[i].href,
            content: plagiarizedContent,
            plagiarizedList: similiarTextList,
            percentage: calculatePercentage(userContent, similiarTextList),
        });
    }

    // sort by percentage
    plagiarizedPaper.sort((a, b) => b.percentage - a.percentage);
    return plagiarizedPaper;
}


// find list of substring in userText that is similar to substring in plagiarizedText
function getSimilarTextList(userText: string, plagiarizedText: string): string[] {
    const userNGrams = shingles(userText, N_GRAMS);
    const plagiarizedNGrams = shingles(plagiarizedText, N_GRAMS);
    const similarText: string[] = [];

    for(let i = 0; i < userNGrams.length; i++){
        if(plagiarizedNGrams.includes(userNGrams[i])){ // optimize this part, might use a non exact search
            similarText.push(userNGrams[i]);
        }
    }

    return similarText;
}

function getSimilarTextListAsRange(userText: string, plagiarizedText: string): number[][] {
    const userNGrams = shingles(userText, N_GRAMS);
    const plagiarizedNGrams = shingles(plagiarizedText, N_GRAMS);
    const similarText: number[][] = [];

    for(let i = 0; i < userNGrams.length; i++){
        if(plagiarizedNGrams.includes(userNGrams[i])){ // optimize this part, might use a non exact search
            similarText.push([i, i+N_GRAMS]);
        }
    }

    return similarText;
}


function calculateAllPercentage(content: string, plagiarizeResult: PlagiarizedPaper[]): number {
    let markedContent = `${content}`; // copy

    for(let i = 0; i < plagiarizeResult.length; i++){
        for(let j = 0; j < plagiarizeResult[i].plagiarizedList.length; j++){
            markedContent = markedContent.replace(plagiarizeResult[i].plagiarizedList[j], '_'.repeat(plagiarizeResult[i].plagiarizedList[j].length));
        }
    }

    let totalMarked = 0;
    for(let i = 0; i < markedContent.length; i++){
        if(markedContent[i] === '_') totalMarked++;
    }

    console.log(markedContent)

    return totalMarked / content.length * 100;
}


function calculatePercentage(content: string, plagiarizedList: string[]): number {
    let markedContent = `${content}`; // copy

    for(let i = 0; i < plagiarizedList.length; i++){
        markedContent = markedContent.replace(plagiarizedList[i], '_'.repeat(plagiarizedList[i].length));
    }

    let totalMarked = 0;
    for(let i = 0; i < markedContent.length; i++){
        if(markedContent[i] === '_') totalMarked++;
    }

    return totalMarked / content.length * 100;

}


function clean(content: string) {
    content = content.replace(/\r/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ');
    content = content.replace(/----------------Page \(\w+\) Break----------------/g, '');
    return content;
}

function cleanDestruct(content: string) {
    content = content.toLowerCase();
    return content;
}
