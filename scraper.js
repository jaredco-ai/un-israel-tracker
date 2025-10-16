const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const COMMITTEES = [
  { name: 'Plenary', url: 'https://igov.un.org/ga/plenary/80/items' },
  { name: 'First Committee', url: 'https://igov.un.org/ga/c1/80/items' },
  { name: 'Second Committee', url: 'https://igov.un.org/ga/c2/80/items' },
  { name: 'Third Committee', url: 'https://igov.un.org/ga/c3/80/items' },
  { name: 'Fourth Committee', url: 'https://igov.un.org/ga/c4/80/items' }
  ];

async function searchCommitteeForIsrael(page, committee) {
    console.log(`Searching ${committee.name}...`);

  try {
        await page.goto(committee.url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(1000);

      const filterInput = await page.$('input[placeholder="Filter..."]');
        if (filterInput) {
                await filterInput.type('Israel');

          const searchBtn = await page.$('button[type="button"]');
                if (searchBtn) await searchBtn.click();

          await page.waitForTimeout(1500);

          const results = await page.evaluate(() => {
                    const items = [];
                    document.querySelectorAll('a').forEach(link => {
                                if (link.textContent.includes('Israel')) {
                                              items.push({
                                                              title: link.textContent.trim(),
                                                              href: link.href
                                              });
                                }
                    });
                    return items;
          });

          return results;
        }
  } catch (error) {
        console.error(`Error searching ${committee.name}:`, error.message);
  }

  return [];
}

async function runSearch() {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

  const allResults = {};
    const timestamp = new Date().toISOString();

  for (const committee of COMMITTEES) {
        try {
                const results = await searchCommitteeForIsrael(page, committee);
                if (results.length > 0) {
                          allResults[committee.name] = results;
                          console.log(`Found ${results.length} items in ${committee.name}`);
                }
        } catch (error) {
                console.error(`Failed to process ${committee.name}:`, error.message);
        }
  }

  const outputFile = path.join(__dirname, `israel-items-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(outputFile, JSON.stringify({ timestamp, results: allResults }, null, 2));

  console.log(`Results saved to ${outputFile}`);
    console.log('Search completed successfully');

  await browser.close();
}

runSearch().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
