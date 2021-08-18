const fs = require('fs');
const puppeteer = require('puppeteer');
const prompt = require('prompt');
const objectsToCSV = require('objects-to-csv')

console.log('\nGoogle Meta Scraper. (c) 2021 ryanlaufsen')

// Setup
console.log('\nReading search terms... ');
const searchTerms = fs.readFileSync('searchTerms.txt').toString();
console.log('The following search terms will be scraped for meta info: \n\n' + searchTerms + '\n');

const searchTermsArr = searchTerms.split('\r\n');

// Main
async function main() {

    const browser = await puppeteer.launch();

    async function scrape(searchStr, resultNum) {
        let page = await browser.newPage();
        await page.goto(`https://www.google.com/search?q=${searchStr}`, { waitUntil: 'load', timeout: 0 });
        const metaArr = await page.evaluate((resultNum) => {
            let metaArr = [];
            for (let i = 0; i < resultNum; i++) {
                let element = document.querySelectorAll('div[style="-webkit-line-clamp:2"]')[i];
                if (element !== undefined) {
                    metaArr.push(element.innerText);
                } else {
                    metaArr.push(`(Search result no. ${i+1} meta info not found on the first page)`);
                }
            }
            return metaArr;
        }, resultNum);

        return {
            searchTerm: searchStr,
            scrapedMeta: metaArr
        }
    }
    let metaStrs = [];

    prompt.start();
    prompt.get(['depth'], (err, res) => {
        if (err) {
            console.error(err)
        } else {
            console.log(`Searching first ${res.depth} results!\n`);
            scrapeAll(res.depth);
        }
    });

    function scrapeAll(resultNum) {
        searchTermsArr.forEach(async (el) => {
            console.log(await scrape(el.toString(), resultNum));

            let metaInfo = await scrape(el.toString(), resultNum);
            metaStrs.push(metaInfo.scrapedMeta);

            const csv = new objectsToCSV(metaStrs);
            await csv.toDisk('./scrapedMeta.csv');
        });
    }

}

main();