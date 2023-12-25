// npm install minimist puppeteer
// node automation.js --file=creds.json

let minimist = require("minimist");
let puppeteer = require("puppeteer");
let fs = require("fs");

let args = minimist(process.argv);
async function run() {
  let browser = await puppeteer.launch({
    headless: false,
    args: ["--start-maximized"],
    defaultViewport: null,
  });
  let credsJSON = fs.readFileSync(args.file, "utf-8");
  let creds = JSON.parse(credsJSON); //JSON to JSO
  let email = creds.email;
  let pwd = creds.pwd;
  let pages = await browser.pages();
  let page = pages[0];

  await page.goto(creds.login);

  await page.waitFor(1000);

  await page.waitForSelector("input#input-1");
  await page.type("input#input-1", email, { delay: 50 });

  await page.waitForSelector("input#input-2");
  await page.type("input#input-2", pwd, { delay: 50 });

  await page.waitFor(1000);

  await page.waitForSelector("button[data-analytics='LoginPassword']");
  await page.click("button[data-analytics='LoginPassword']");

  await page.waitFor(1000);

  await page.waitForSelector("a[data-analytics='NavBarContests']");
  await page.click("a[data-analytics='NavBarContests']");

  await page.waitFor(1000);

  await page.waitForSelector("a[href='/administration/contests/']");
  await page.click("a[href='/administration/contests/']");

  await page.waitFor(1000);

  await page.waitForSelector("a[data-attr7='1']");

  let totalPages = await page.$eval("a[data-attr1='Last']", function (data) {
    let totalKaString = data.getAttribute("data-page");

    let total = parseInt(totalKaString);

    return total;
  });

  for (let i = 1; i <= totalPages - 1; i++) {
    await forOnePage(page, browser, creds);

    await page.waitFor(3000);
    if (i < totalPages) {
      await page.waitForSelector("a[data-attr1='Right']");
      await page.click("a[data-attr1='Right']");
    }
  }

  await forOnePage(page, browser, creds);

  await browser.close();
}
run();

async function forOnePage(page, browser, creds) {
  await page.waitForSelector("a.backbone.block-center");

  let cLinks = await page.$$eval(
    "a.backbone.block-center",
    function (cLinksData) {
      let urls = [];

      for (let i = 0; i < cLinksData.length; i++) {
        let url = cLinksData[i].getAttribute("href");
        urls.push(url);
      }

      return urls;
    }
  );

  await page.waitFor(3000);

  for (let i = 0; i < cLinks.length; i++) {
    let ctab = await browser.newPage();
    await ctab.bringToFront();
    await ctab.goto("https://www.hackerrank.com" + cLinks[i]);

    await ctab.waitFor(3000);

    await ctab.waitForSelector("li[data-tab='moderators']");
    await ctab.click("li[data-tab='moderators']");

    await ctab.waitForSelector("input#moderator");
    await ctab.click("input#moderator");

    await ctab.type("input#moderator", creds.moderator, { delay: 100 });

    await ctab.keyboard.press("Enter");

    await page.waitFor(1000);

    await ctab.close();

    await page.waitFor(3000);
  }
}
