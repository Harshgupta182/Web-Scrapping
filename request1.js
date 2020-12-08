
let request = require("request");
// npm install cheerio 
let cheerio = require("cheerio");
// preinstalled
let fs = require("fs");
let path = require("path")
let xlsx= require("xlsx")
//home page

request("https://www.espncricinfo.com/series/_/id/8048/season/2020/indian-premier-league",MainMatchCb)
function MainMatchCb(err,res,html){
    let sTool= cheerio.load(html);
    let allmatchPageUrl=  sTool("a[data-hover='View All Results']").attr("href");
    let fUrl="https://www.espncricinfo.com"+allmatchPageUrl;
    AllMatchPage(fUrl);
}
// all match page
function AllMatchPage(fUrl){
    request (fUrl,getAMUrl);
    function getAMUrl(err,resp,html){
        // console.log(html);
     let sTool= cheerio.load(html);
      let allmatchUrlElem=  sTool("a[data-hover='Scorecard']");
      for(let i=0;i<allmatchUrlElem.length;i++){
      let href=    sTool(allmatchUrlElem[i]).attr("href");
     let fUrl="https://www.espncricinfo.com"+href;
     findDataofAMatch(fUrl);
      }
    }
}

function findDataofAMatch(url) {
    request( url, whenDataArrive);
    function whenDataArrive(err, resp, html) {
       
       console.log("recieved html");
        
        let sTool = cheerio.load(html);
        let tableElem = sTool("div.card.content-block.match-scorecard-table .Collapsible");
        console.log(tableElem.length);
        let count = 0;
        for (let i = 0; i < tableElem.length; i++) {
            let teamName = sTool(tableElem[i]).find("h5.header-title.label").text();
            let teamstrArr = teamName.split("Innings")
            teamName = teamstrArr[0].trim()
            let rowsOfATeam = sTool(tableElem[i]).find(".table.batsman").find("tbody tr");
            for (let j = 0; j < rowsOfATeam.length; j++) {
                let rCols = sTool(rowsOfATeam[j]).find("td");
                let isBatsManRow = sTool(rCols[0]).hasClass("batsman-cell");
                if (isBatsManRow == true) {
                    count++;
                    let pName = sTool(rCols[0]).text().trim()
                    let runs = sTool(rCols[2]).text().trim()
                    let balls = sTool(rCols[3]).text().trim()
                    let fours = sTool(rCols[5]).text().trim()
                    let sixes = sTool(rCols[6]).text().trim()
                    let sr = sTool(rCols[7]).text().trim()
                    processPlayer(teamName, pName, runs, balls, fours, sixes, sr)

                }
            }
            console.log("```````````````````````````````````````````````````````````");
        }

    }





    function processPlayer(team, name, runs, balls, fours, sixes, sr) {
        // teamNAme=> does this belong to an existing team
        let dirPath = team
        let pMatchstats = {
            Team: team,
            Name: name,
            Runs: runs,
            Balls: balls,
            fours: fours,
            Sixes: sixes,
            StrikeRate: sr

        }
        if (fs.existsSync(dirPath)) {
            //file check
        }

        // => check if player file exist or not
        else {
            fs.mkdirSync(dirPath);

        }

        let playerfilePath = path.join(dirPath, name + ".xlsx")
        let pData = []
        if (fs.existsSync(playerfilePath)) {

            pData = excelReader(playerfilePath,name)
            pData.push(pMatchstats)

        } else {
            //create file


            console.log("file Of Player", playerfilePath, "created")
            pData = [pMatchstats]



        }


        excelWriter(playerfilePath,pData,name)
       




    }

function excelReader(filePath, name) {

if (!fs.existsSync(filePath)) {
    return null;
}else{
    let wt = xlsx.readFile(filePath)
    let excelData = wt.Sheets[name]
    let ans = xlsx.utils.sheet_to_json(excelData)
    return ans;
}
}

function excelWriter(filePath, json, name) {

let newWb = xlsx.utils.book_new()

let newWS = xlsx.utils.json_to_sheet(json);

xlsx.utils.book_append_sheet(newWb ,newWS, name)

xlsx.writeFile(newWb ,filePath)
}


















}
