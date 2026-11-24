const { chromium } = require('playwright'); const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:900},deviceScaleFactor:1.4});
await p.goto('file://'+path.join(__dirname,process.argv[2]));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
await p.screenshot({path:process.argv[3],fullPage:true});await b.close();})();
