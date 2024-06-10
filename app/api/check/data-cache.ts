import { Paper } from '@/app/paper/paper';
import fs from 'fs';
import path from 'path';

let cachedData: Paper[] = [];

export function loadDataClean() {
  if (cachedData.length > 0) {
    return cachedData;
  }
  const filePath1 = path.resolve(process.cwd(), 'app/dataset/json/data-clean-chunk-1.json');
  const filePath2 = path.resolve(process.cwd(), 'app/dataset/json/data-clean-chunk-2.json');
  const rawData1 = fs.readFileSync(filePath1, 'utf-8');
  const rawData2 = fs.readFileSync(filePath2, 'utf-8');
  const parsedData1 = JSON.parse(rawData1);
  const parsedData2 = JSON.parse(rawData2);
  
  cachedData = [...parsedData1, ...parsedData2];
  return cachedData;
};

