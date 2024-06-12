
/**
 * Return n-grams of a content
 * @param content 
 * @param n 
 * @returns 
 */
export function shingles(content: string, n: number): string[] {
    const shingle: string[] = [];
    const split = content.split(' ');
    const lenMinusN = split.length - n + 1;
    for(let i = 0; i < lenMinusN; i++){
        const strList = split.slice(i, i+n)
        shingle.push(strList.join(' '));
    }
    return shingle;
}

/**
 * Jaccard similarity between two strings
 * @param a 
 * @param b 
 * @returns 
 */
export function jaccardSimilarity(a: string[], b: string[]): number {
    const intersection = a.filter(value => b.includes(value));
    const union: string[] = [];

    for(let i = 0; i < a.length; i++){
        if(!union.includes(a[i])) union.push(a[i]);
    }
    for(let i = 0; i < b.length; i++){
        if(!union.includes(b[i])) union.push(b[i]);
    }

    return intersection.length / union.length;
}

/**
 * Smith-Waterman algorithm for local sequence alignment
 * @param a 
 * @param b 
 * @returns 
 */
export function smithWaterman(a: string, b: string): number {
    const n = a.length;
    const m = b.length;
    const gap = -1;
    const mismatch = -1;
    const match = 2;

    const dp: number[][] = new Array(n+1).fill(0).map(() => new Array(m+1).fill(0));

    for(let i = 1; i <= n; i++){
        for(let j = 1; j <= m; j++){
            dp[i][j] = Math.max(
                dp[i-1][j-1] + (a[i-1] === b[j-1] ? match : mismatch),
                dp[i-1][j] + gap,
                dp[i][j-1] + gap,
                0
            );
        }
    }

    console.log(Math.max(...dp.map(row => Math.max(...row))))

    return Math.max(...dp.map(row => Math.max(...row)));
}

export function levenshteinDistance(a: string, b: string): number {
    const n = a.length;
    const m = b.length;
    const mat: number[][] = new Array(n+1).fill(0).map(() => new Array(m+1).fill(0));

    for(let i = 0; i <= n; i++) mat[i][0] = i;
    for(let i = 0; i <= m; i++) mat[0][i] = i;

    for(let i = 1; i <= n; i++){
        for(let j = 1; j <= m; j++){
            mat[i][j] = Math.min(
                mat[i-1][j] + 1,
                mat[i][j-1] + 1,
                mat[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
            );
        }
    }

    return mat[n][m];
}

/**
 * Rabin-Karp algorithm for string matching
 * @param content 
 * @param pattern 
 * @returns 
 */
export function rabinKarp(content: string, pattern: string): number {
    const d = 256;
    const q = 101;
    const n = content.length;
    const m = pattern.length;
    const h = Math.pow(d, m-1) % q;
    let p = 0;
    let t = 0;

    for(let i = 0; i < m; i++){
        p = (d * p + pattern.charCodeAt(i)) % q;
        t = (d * t + content.charCodeAt(i)) % q;
    }

    const nMinM = n - m;
    for(let i = 0; i <= nMinM; i++){
        if(p === t){
            let match = true;
            for(let j = 0; j < m; j++){
                if(pattern[j] !== content[i+j]){
                    match = false;
                    break;
                }
            }
            if(match) return i;
        }
        if(i < nMinM){
            t = (d * (t - content.charCodeAt(i) * h) + content.charCodeAt(i+m)) % q;
            if(t < 0) t += q;
        }
    }

    return -1;
}


export function longestCommonSubsequence(a: string, b: string): number {
    const n = a.length;
    const m = b.length;
    const dp: number[][] = new Array(n+1).fill(0).map(() => new Array(m+1).fill(0));

    for(let i = 1; i <= n; i++){
        for(let j = 1; j <= m; j++){
            dp[i][j] = Math.max(
                dp[i-1][j],
                dp[i][j-1],
                dp[i-1][j-1] + (a[i-1] === b[j-1] ? 1 : 0)
            );
        }
    }

    return dp[n][m];
}

export function longestCommonSubstring(a: string, b: string): number {
    const n = a.length;
    const m = b.length;
    const dp: number[][] = new Array(n+1).fill(0).map(() => new Array(m+1).fill(0));
    let max = 0;

    for(let i = 1; i <= n; i++){
        for(let j = 1; j <= m; j++){
            if(a[i-1] === b[j-1]){
                dp[i][j] = dp[i-1][j-1] + 1;
                max = Math.max(max, dp[i][j]);
            }
        }
    }

    return max;
}

/**
 * Find all occurrences of patterns in content
 * @param content 
 * @param patterns 
 * @returns [start, end][] where start is the starting index of the pattern and end is the ending index of the pattern
 */
export function ahoCorasick(content: string, patterns: string[]): number[][] {
    return [];
}
  

export function cosineSimilarity(a: string, b: string){
    const splitA = a.split(' ');
    const splitB = b.split(' ');

    const intersection = splitA.filter(value => splitB.includes(value));
    const union: string[] = [];

    for(let i = 0; i < splitA.length; i++){
        if(!union.includes(splitA[i])) union.push(splitA[i]);
    }
    for(let i = 0; i < splitB.length; i++){
        if(!union.includes(splitB[i])) union.push(splitB[i]);
    }

    return intersection.length / union.length;
}


export function hammingDistance(a: string, b: string): number {
    if(a.length !== b.length) return -1;

    let distance = 0;
    for(let i = 0; i < a.length; i++){
        if(a[i] !== b[i]) distance++;
    }

    return distance;
}

export function kmp(a: string, b: string): boolean {
    const n = a.length;
    const m = b.length;
    const lps = new Array(m).fill(0);
    let j = 0;

    computeLPSArray(b, m, lps);

    for(let i = 0; i < n; i++){
        if(a[i] === b[j]){
            j++;
        } else {
            while(j > 0 && a[i] !== b[j]){
                j = lps[j-1];
            }
        }

        if(j === m) return true;
    }

    return false;
}

function computeLPSArray(b: string, m: number, lps: number[]){
    let len = 0;
    lps[0] = 0;
    let i = 1;

    while(i < m){
        if(b[i] === b[len]){
            len++;
            lps[i] = len;
            i++;
        } else {
            if(len !== 0){
                len = lps[len-1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }
}