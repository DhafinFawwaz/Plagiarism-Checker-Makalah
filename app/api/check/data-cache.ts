import { Paper } from '@/app/paper/paper';
import fs from 'fs';
import path from 'path';

let cachedData: Paper[] = [];

export function loadDataClean() {
  if (cachedData.length > 0) {
    return cachedData;
  }
  const filePath = path.resolve(process.cwd(), 'app/dataset/json/data-clean.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  cachedData = JSON.parse(rawData);

  return cachedData;
};

