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
    const contentDestructed = cleanDestruct(content);
    
    const plagiarizedPaper = getPlagiarizedPaper(contentDestructed, data);
    const result: PlagiarizeResult = {
        selectedPaper: { title: paper.title, href: paper.href, content: content},
        plagiarizedPaper: plagiarizedPaper,
        percentage: calculateAllPercentage(contentDestructed, plagiarizedPaper),
        executionTime: 0, // must be set at the end to ensure the correct time
    };

    result.executionTime = performance.now() - startTime;
    return result;
}


function getPlagiarizedPaper(content: string, data: Paper[]){
    const plagiarizedPaper: PlagiarizedPaper[] = [];
    
    const len = data.length; // dont forget change to this
    for(let i = 2216; i < 2220; i++){
        const plagiarizedContent = cleanDestruct(data[i].content);
        const similiarTextList = getSimilarTextList(content, plagiarizedContent);
        if(similiarTextList.length === 0) continue;
        
        plagiarizedPaper.push({
            title: data[i].title,
            href: data[i].href,
            content: plagiarizedContent,
            plagiarizedList: similiarTextList,
            percentage: calculatePercentage(content, similiarTextList),
        });
    }

    // sort by percentage
    plagiarizedPaper.sort((a, b) => b.percentage - a.percentage);
    return plagiarizedPaper;
}


// find list of substring in userText that is similar to substring in plagiarizedText
function getSimilarTextList(userText: string, plagiarizedText: string): number[][] {
    const userNGrams = shingles(userText, N_GRAMS);
    const plagiarizedNGrams = shingles(plagiarizedText, N_GRAMS);
    const similarText: number[][] = [];

    for(let i = 0; i < userNGrams.length; i++){
        if(isNGramsListContainsNGrams(plagiarizedNGrams, userNGrams[i])){
            similarText.push([i, i+N_GRAMS]);
        }
    }

    return combineOverlapping(similarText);
}
            
// optimize this part, might use a non exact search
function isNGramsListContainsNGrams(nGrams: string[], nGram: string): boolean {
    return nGrams.includes(nGram);
}

// Combine overlapping
  // [[1, 3], [2, 4], [5, 7]] => [[1, 4], [5, 7]]
function combineOverlapping(plagiarizedList: number[][]): number[][] {
    const result = [];
    const len = plagiarizedList.length;
    if(len === 0) return [];

    let [start, end] = plagiarizedList[0];
    for(let i = 1; i < len; i++) {
        const [s, e] = plagiarizedList[i];
        if(s <= end) {
            end = Math.max(end, e);
        } else {
            result.push([start, end]);
            [start, end] = [s, e];
        }
    }
    result.push([start, end]);
    return result;
}


// combine all overlapping, then calculate the percentage
function calculateAllPercentage(content: string, plagiarizeResult: PlagiarizedPaper[]): number {
    if(plagiarizeResult.length === 0) return 0;

    let result = plagiarizeResult[0].plagiarizedList;
    for(let i = 0; i < plagiarizeResult.length; i++){
        result = combineOverlapping(result.concat(plagiarizeResult[i].plagiarizedList));
    }
    const length = content.split(' ').length;
    let total = 0;
    for(let i = 0; i < result.length; i++){
        total += result[i][1] - result[i][0];
    }

    return total / length * 100;
}


function calculatePercentage(content: string, plagiarizedList: number[][]): number {
    const length = content.split(' ').length;
    let total = 0;
    for(let i = 0; i < plagiarizedList.length; i++){
        total += plagiarizedList[i][1] - plagiarizedList[i][0];
    }
    return total / length * 100;
}

function clean(content: string) {
    content = content.trim();
    content = content.replace(/\r/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ');
    content = content.replace(/----------------Page \(\w+\) Break----------------/g, '');
    return content;
}

function cleanDestruct(content: string) {
    content = content.toLowerCase();
    return content;
}
