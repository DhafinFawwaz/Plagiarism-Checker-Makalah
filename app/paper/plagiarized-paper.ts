import { Paper } from "./paper";

export class PlagiarizedPaper extends Paper {
    plagiarizedList: string[];
    percentage: number;

    constructor(title: string, href: string, plagiarizedList: string[], percentage: number) {
        super(title, href);
        this.plagiarizedList = plagiarizedList;
        this.percentage = percentage;
    }
}