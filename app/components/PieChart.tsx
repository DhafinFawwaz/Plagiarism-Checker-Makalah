"use client";

import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartData } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

type PieChartProps = {
    plagiarizedPercentage: number;
}

export default function PieChart({plagiarizedPercentage}: PieChartProps) {
    const noBorder = plagiarizedPercentage === 0 || plagiarizedPercentage === 100;
    let data= [
        {
            label: "Unique",
            value: 100-plagiarizedPercentage,
            color: "rgb(9, 9, 11)",
        },
        {
            label: "Plagiarized",
            value: plagiarizedPercentage,
            color: "rgb(244, 63, 94)",
        },
    ]
    
    const options: any = {
        plugins: {
            responsive: true,
        },
        cutout: "65%",
        radius: "100%",
    };
    
    const finalData: ChartData<"doughnut", number[], string> = {
        datasets: [
            {
                data: data.map((item) => Math.round(item.value)),
                backgroundColor: data.map((item) => item.color),
                borderColor: "rgb(9, 9, 11)",
                hoverBorderWidth: 5,
                borderWidth: 4
            },
        ],
    };
    
    return <div className="relative w-32 h-32 justify-center items-center flex">
        <div className="absolute mt-2 text-2xl font-bold">
            {plagiarizedPercentage}%
        </div>
        <Doughnut data={finalData} options={options} />
    </div>;
}