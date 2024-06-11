import { Paper } from "./paper";

export class PlagiarizedPaper extends Paper {
    plagiarizedList: number[][];
    percentage: number;

    constructor(title: string, href: string, plagiarizedList: number[][], percentage: number) {
        super(title, href);
        this.plagiarizedList = plagiarizedList;
        this.percentage = percentage;
    }
}