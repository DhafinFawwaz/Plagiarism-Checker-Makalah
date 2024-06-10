import scrapeLinks from "@/app/dataset/json/scrape-links.json"
import Link from "next/link"

export default function Paper(){
    return <main className="flex min-h-screen flex-col items-center justify-between py-4 px-4 sm:px-16 md:px-24 lg:px-36 bg-zinc-950">
    <div className="flex flex-col w-full">
        <h1 className="text-center mb-4">Paper List</h1>
        <p className="font-normal mb-4">Want to check your paper ? go <Link href="/" className="text-blue-400 hover:text-indigo-500">back</Link></p>
        {scrapeLinks.map((link, index) => <>
            <a target="_blank" href={link} key={index} className="text-blue-400 hover:text-indigo-500 truncate">{link}</a>
        </>)}
    </div>
</main>
}