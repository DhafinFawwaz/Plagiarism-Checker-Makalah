import { PlagiarizeResult } from '@/app/page';
import { Paper } from '@/app/paper/paper';


// content is still not clean
export function findPlagiarism(dirtyContent: string, data: Paper[]): PlagiarizeResult{
    const content = clean(dirtyContent);
    const result: PlagiarizeResult = {
        percentage: 30,
        executionTime: 0,
        plagiarizedPaper: [
            { title: "Paper 1", href: "https://example.com/paper1.pdf", content: "", plagiarizedList: ["pengambilan mata kuliah", "d ab", "zzz"], percentage: 20},
            { title: "Paper 2", href: "https://example.com/paper1.pdf", content: "", plagiarizedList: ["ah text dan sebuah pola, d"], percentage: 30},
            { title: "Paper 3", href: "https://example.com/paper1.pdf", content: "", plagiarizedList: ["triad-tried-tries-trims-trams", "terdapat perbedaan antara KSM"], percentage: 50},
        ],
        selectedPaper: { title: "pdfFile.name", href: "", content: content}
    };

    return result;
}



function clean(content: string) {
    content = content.replace(/\r/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ');
    content = content.replace(/----------------Page \(\w+\) Break----------------/g, '');
    return content;
}