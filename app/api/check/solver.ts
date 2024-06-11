import { PlagiarizeResult } from '@/app/page';
import { Paper } from '@/app/paper/paper';
import { PlagiarizedPaper } from '@/app/paper/plagiarized-paper';
import { cosineSimilarity, hammingDistance, jaccardSimilarity, kmp, levenshteinDistance, shingles } from './algorithm';

const SHINGLES_AMOUNT = 5;
const LEVENSHTEIN_THRESHOLD = 0.5;
  
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
    
    const len = data.length;
    const userShingles = shingles(content, SHINGLES_AMOUNT);
    for(let i = 0; i < len; i++){
        const plagiarizedContent = data[i].content; // already lowercased in preprocessing
        const similiarTextList = getSimilarTextList(userShingles, plagiarizedContent);
        if(similiarTextList.length === 0) continue;

        console.log("(%d/%d)", i+1, len)
        
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
function getSimilarTextList(userShingles: string[], plagiarizedText: string): number[][] {
    const startTime = performance.now();
    const plagiarizedShingles = shingles(plagiarizedText, SHINGLES_AMOUNT);
    
    const similarText: number[][] = [];

    for(let i = 0; i < userShingles.length; i++){
        if(isShinglesListContainsShingles(plagiarizedShingles, userShingles[i])){
            similarText.push([i, i+SHINGLES_AMOUNT]);
        }
    }

    return combineOverlapping(similarText);
}
            
// optimize this part, might use a non exact search
function isShinglesListContainsShingles(shinglesList: string[], shingles: string): boolean {
    return shinglesList.includes(shingles);

    // for(let i = 0; i < shinglesList.length; i++){
    //     if(shinglesList[i] === shingles) return true;
    // }
    // return false;

    // for(let i = 0; i < shinglesList.length; i++){
    //     if(kmp(shinglesList[i], shingles)) return true;
    // }
    // return false;
    
    // for(let i = 0; i < shinglesList.length; i++){
    //     const longest = Math.max(shinglesList[i].length, shingles.length);
    //     if(levenshteinDistance(shinglesList[i], shingles) <= longest * LEVENSHTEIN_THRESHOLD) return true;
    // }
    // return false;

    // for(let i = 0; i < shinglesList.length; i++){
    //     if(cosineSimilarity(shinglesList[i], shingles) > 0.5) return true;
    // }
    // return false;

    // for(let i = 0; i < shinglesList.length; i++){
    //     const longest = Math.max(shinglesList[i].length, shingles.length);
    //     if(hammingDistance(shinglesList[i], shingles) > 0.5) return true;
    // }
    // return false;
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
