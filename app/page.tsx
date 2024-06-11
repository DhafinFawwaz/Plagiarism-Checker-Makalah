"use client";
import Link from "next/link";
import PieChart from "./components/PieChart";
import React, { useEffect, useState } from "react";
import { Paper } from "./paper/paper";
import { PlagiarizedPaper } from "./paper/plagiarized-paper";

export type PlagiarizeResult = {
  percentage: number;
  plagiarizedPaper: PlagiarizedPaper[];
  selectedPaper: Paper;
  executionTime: number;
}

export default function Home() {
  // from user iput
  const [pdfFile, setPdfFile] = useState<File>(new File([], "-", undefined));

  // Blocks check button when API is loading
  const [isApiLoading, setIsApiLoading] = useState<boolean>(false);
  
  // from API
  const [plagiarizedResult, setPlagiarizedResult] = useState<PlagiarizeResult>({
    percentage: -1,
    executionTime: 0,
    plagiarizedPaper: [],
    selectedPaper: { title: "", href: "", content: ""}
  });

  // From selection by user
  // const [choosenPlagiarizedPaper, setChoosenPlagiarizedPaper] = useState<PlagiarizedPaper>(plagiarizedResult.plagiarizedPaper[0]);
  const [choosenIndex, setChoosenIndex] = useState<number>(0);

  function getFileSizeFormat(size: number) {
    size /= 1024;
    if(size < 1024) return Math.round(size*100)/100 + " KB";

    return Math.round(size/1024*100)/100 + " MB";
  }

  function getTimeFormat(time: number): string {
    if(time < 1000) return Math.round(time*100)/100 + " ms";
    time /= 1000;
    if(time < 60) return Math.round(time*100)/100 + " s";
    let second = time % 60;
    time /= 60;
    return Math.floor(time) + " m " + Math.round(second*100)/100 + " s";
  }

  function onFileChanged(e: React.ChangeEvent<HTMLInputElement>) {
    if(!e.target.files) return;
    const file = e.target.files[0];

    if (file) {
      setPdfFile(file);
    }
  }

  function block(content: string){
    return <span id="marked" className="inline bg-indigo-600">{content}</span>;
  }
  function getPlagiarizedBlock(content: string, plagiarizedList: string[]): JSX.Element {
    // sort
    plagiarizedList.sort((a, b) => b.length - a.length);

    const escapeRegExp = (string: string) =>
      string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
    const regexPattern = plagiarizedList.map(escapeRegExp).join('|');
    const regex = new RegExp(`(${regexPattern})`, 'gi');
  
    const parts = content.split(regex);
    const highlightedContent = parts.map((part, index) => {
      if (plagiarizedList.some(plagiarized => new RegExp(`^${escapeRegExp(plagiarized)}$`, 'i').test(part))) {
        return block(part);
      }
      return part;
    });
  
    return <p className="text-justify text-sm font-normal w-full">{highlightedContent}</p>;

    


    
  }
  

  // API call
  async function startCheck(){
    if(!pdfFile || pdfFile.name === "-") return;

    const formData = new FormData();
    formData.append("file", pdfFile);
    setIsApiLoading(true);
    try{
      const res = await fetch("/api/check", {
        method: "POST",
        body: formData
      });
      if(!res.ok) {
        setIsApiLoading(false);
        return;
      }
  
      const data = await res.json();
      if(!data) {
        setIsApiLoading(false);
        alert("An error occured");
        return;
      }
      if(data.error) {
        setIsApiLoading(false);
        alert(data.error);
        return;
      }
      setPlagiarizedResult(data);
      chooseIndex(0);

    } catch(e) {
      console.error(e);
    }
    setIsApiLoading(false);
  }

  async function chooseIndex(index: number){
    setChoosenIndex(index);
  }

  useEffect(() => {
    document.getElementById("marked")?.scrollIntoView();
  }, [choosenIndex])
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between py-4 px-4 sm:px-16 md:px-24 lg:px-36 bg-zinc-950">
      
      <div className="flex flex-col w-full">
        <h1 className="text-center mb-4">Plagiarism Checker</h1>
        <p className="font-normal mb-4">List of papers that will be checked can be found <Link href="/papers" className="text-blue-400 hover:text-indigo-500">here</Link></p>

        {/* Form */}
        <div className="grid grid-cols-2 gap-4 w-full">
          
          {/* Drag & drop file */}
          <input id="file-input" type="file" accept=".pdf" hidden onChange={onFileChanged}/>
          <label htmlFor="file-input" className="w-full bg-zinc-900 rounded-xl flex flex-col items-center justify-center h-full hover:bg-zinc-700 cursor-pointer duration-100">
            <div>Select File Here</div>
            <div className="text-zinc-400 text-sm">PDF File only</div>
          </label>
          
          {/* File info */}
          <div className="h-36 justify-between flex flex-col">
            <div>
              <div>Selected File:</div> <div className="text-sm">{pdfFile.name}</div>
              <div className="h-1"></div>
              <div>Size:</div> <div className="text-sm">{pdfFile.size === 0 ? "-" : getFileSizeFormat(pdfFile.size)}</div>
            </div>
            <div className="h-1"></div>
            <button onClick={startCheck} className="px-4 py-2 w-full justify-center disabled:bg-zinc-600 disabled:text-zinc-300 disabled:cursor-not-allowed" disabled={isApiLoading}>{!isApiLoading ? "Check!" : "Checking..."}</button>
          </div>
        </div>

      
        {/* Result */}
        {plagiarizedResult.percentage === -1 ? <></> : <>
        
        <div className="mt-4"></div>
        <div className="gap-4 flex flex-col-reverse sm:flex-row w-full">
          
          <div className="flex flex-col bg-zinc-900 rounded-xl flex-1 overflow-clip border-16 border-zinc-900">
            <div className="flex gap-2 w-full justify-center">
              <h2 className="mb-2 ">Result</h2>
              <h2 className="mb-2 text-left font-normal text-sm mt-1">(Done in {getTimeFormat(plagiarizedResult.executionTime)})</h2>
            </div>
            <div className="w-full">
              {plagiarizedResult.plagiarizedPaper.length === 0 ? <p className="text-left text-sm font-normal">{plagiarizedResult.selectedPaper.content}</p> : 
                getPlagiarizedBlock(plagiarizedResult.selectedPaper.content, plagiarizedResult.plagiarizedPaper[choosenIndex].plagiarizedList)
              }
            </div>
            <p></p>
          </div>

          {/* Chart */}
          <div className="flex flex-col items-center bg-zinc-900 rounded-xl p-4 w-full sm:w-56 md:w-72 lg:w-80">
            <div className="font-bold text-xl">Plagiarized</div>
            <PieChart plagiarizedPercentage={Math.round(plagiarizedResult.percentage*100)/100}></PieChart>

            <div className="gap-3 flex flex-col mt-3 w-full">

              {/* Select Button */}
              {plagiarizedResult.plagiarizedPaper.map((paper, index) => (<>
                <button key={index} onClick={e => chooseIndex(index)} className={"bg-zinc-800 rounded-xl px-2 py-2 w-full h-16 flex gap-2 hover:bg-zinc-700 focus:ring-rose-500 focus:ring-4 " + (choosenIndex!==index ? "" : "ring-4 ring-rose-800")}>
                  
                  <div className="font-bold flex items-center justify-center h-full text-sm w-20">
                    {Math.round(paper.percentage*100)/100}%
                  </div>
                  
                  <div className="text-sm text-left w-full h-full flex items-center">
                    <div className="line-clamp-3">{paper.title}</div>
                  </div>
                  <div className="h-full flex flex-row items-center">
                    <a target="_blank" href={paper.href} className="w-12 h-12 p-1 rounded-xl hover:bg-white flex justify-center items-center group duration-150">
                      <img src="/visit.svg" className="w-6 h-6 invert group-hover:invert-0 duration-150" />
                    </a>
                  </div>
                </button>
              </>))}
            </div>

          </div>
        </div>

        </>}

      </div>

    </main>
  );
}