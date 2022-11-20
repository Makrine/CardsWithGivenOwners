/******************************************************************************\
*     Copyright 2022 Makto Maktavish                                           *
*                                                                              *
*    Licensed under the Apache License, Version 2.0 (the "License");           *
*    you may not use this file except in compliance with the License.          *
*    You may obtain a copy of the License at                                   *
*                                                                              *
*        http://www.apache.org/licenses/LICENSE-2.0                            *
*                                                                              *
*    Unless required by applicable law or agreed to in writing, software       *
*    distributed under the License is distributed on an "AS IS" BASIS,         *
*    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
*    See the License for the specific language governing permissions and       *
*    limitations under the License.                                            *
\******************************************************************************/


var table = document.createElement("TABLE");
var UserAgent = "toolAuthor:tmakrine@gmail.com";
var nation;
var nationInput;
var requestTimes = new Array();
var requestsNum = 0;
var nationCards = new Array();
var nationCardsPaused = new Array();
var nationCardsNumber;
var uniqueNationCardsNumber;
var processedCardsNumber = 0;
var cardData = new Array();
var cardCount = 0;
var junkPrices = {
    'common' : 0.01,
    'uncommon' : 0.05,
    'rare' : 0.10,
    'ultra-rare' : 0.20,
    'epic' : 0.50,
    'legendary' : 1.00
}

// avoid opening the page in several tabs 
// REASON: if it is open in several tabs and requests are made from all of them, it will throw an error of "Too many requests"
localStorage.openpages = Date.now();
var onLocalStorageEvent = function(e){
  if(e.key == "openpages"){
    localStorage.page_available = Date.now();
  }
  if(e.key == "page_available"){
    alert("ONE PAGE IS ALREADY OPEN!");
    var body = document.getElementsByTagName("body");
    body[0].innerHTML = "";
    var warning = document.createElement("p");
    warning.innerHTML = "PLEASE CLOSE THIS TAB!<br>";
    warning.innerHTML += "<br>YOU CAN'T SNEAKILY GET DATA FOR MORE THAN ONE NATION LIKE THAT!<br>";
    warning.innerHTML += "<br>IF I LET YOU, IT'D GIVE YOU THE RATE LIMIT ERROR!"
    warning.style.color = "black";
    warning.style.textAlign = "center";
    warning.style.marginTop = "20%";
    warning.style.marginTop = "20%";
    warning.style.backgroundColor = "orange";
    warning.style.padding = "5px";
    warning.style.fontWeight = "bold";
    body[0].appendChild(warning);
  }
};
window.addEventListener('storage', onLocalStorageEvent, false);
////////////////////////////////////



$(document).ready(function(){
    // buttons
    startButton = document.getElementById("getData");
    contButton = document.getElementById("cont");
    pauseButton = document.getElementById("pause");
    validButton = document.getElementById("validate");
    
    nationInput = document.getElementById("nation");

    $("#nation").on("input", function(){
        nation = document.getElementById("nation").value
        document.getElementById("nationExists").innerHTML = "";
        validButton.disabled = false;
    });
});

// validate whether the nation exists or not
function validate() {

    validButton.disabled = true;
    pauseButton.disabled = true;
    contButton.disabled = true;

    // nullify everything/clear previous results. keep the sent request number.
    processedCardsNumber = 0;
    cardCount = 0;
    nationCards = [];
    //clear table
    var remTable = document.getElementsByTagName("TABLE");
    if(remTable[0] != null){
        remTable[0].remove();
        table = document.createElement("TABLE");
        console.log("removed")       
    }
    // remove the process status
    document.getElementById("processed").innerHTML = "";

    // validate:
    
    try {
        nation = nation.replace(/ /g, '_');
        if(nationExists()) {
            startButton.disabled = false;
            console.log("Validatation: OK");
            document.getElementById("nationExists").innerHTML = "Validated Successfully!"
        }
        else {
            console.log("Validation: FAILED");
            document.getElementById("nationExists").innerHTML = "Nation does NOT exist!"
        }
    }
    catch(err) {
        console.log("ERROR:", err);
        document.getElementById("nationExists").innerHTML = "Please enter a nation name!"
    }
}

function nationExists() {
    requestsNum++;
    var http = new XMLHttpRequest();
    http.open('GET', `https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}`, false);
    http.send();
    if (http.status == 200)
        return true;
    else
        return false;
}


function createTable() {

    var tableHeader = new Array();
        tableHeader.push('#', 'CARD', 'SEASON', 'ASK', 'BID', 'MV', 'JUNK PRICE');

    // Add the header row if it is not created. 
    if(cardCount == 1 && cardData.length){
        var row = table.insertRow(-1);
        for (var i = 0; i < 7; i++) {
            var headerCell = document.createElement("TH");
            headerCell.innerHTML = tableHeader[i];
            row.appendChild(headerCell);
        }
    }
    // Add rows
    row = table.insertRow(-1);
    for (var i = 0; i < 7; i++) {
        var cell = row.insertCell(-1);
        cell.innerHTML = cardData[i];
        if(cardData[7] && i == 4) cell.style.color = 'red';
        else if(!cardData[7] && i == 4) cell.style.color = 'blue';
    }

    // Add the table to the table div
    var parent = document.getElementById("myTable");
    parent.appendChild(table);
    cardData = [];
}


function getNationCards() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {   
        if(xhttp.readyState == 4) { // some data received
            if(xhttp.status == 200) { // everything went OK
                readNationXML(this);
                console.log("OK")
            }
            else if(xhttp.status == 403) console.log(nation + ": Forbidden!");
            else if(xhttp.status == 404) console.log(nation + " does not exist");
            else if(xhttp.status == 429) console.log("Too many requests! Blocked for 15 min!");
            else console.log("Unknown Error! Contact tmakrine@gmail.com or Mackiland");
        }
        else if(xhttp.readyState == 2) { // request is sent
            requestsNum++;
            console.log("Request Sent! " + requestsNum);
        }
    }
    xhttp.open("GET", `https://www.nationstates.net/cgi-bin/api.cgi?userAgent=${UserAgent}&q=cards+deck;nationname=${nation}`);
    xhttp.send();
}

function getCardDataRequest(cardID, season) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {   
        if(xhttp.readyState == 4) { // some data received
            if(xhttp.status == 200) { // everything went OK
                GetCardOwnerCount(this, cardID, season);
                makeMarketRequest();
                processedCardsNumber++;
                console.log("OK")
            }
            else if(xhttp.status == 403) console.log(nation + ": Forbidden!");
            else if(xhttp.status == 404) console.log(nation + " does not exist");
            else if(xhttp.status == 429) console.log("Too many requests! Blocked for 15 min!");
            else console.log("Unknown Error! Contact tmakrine@gmail.com or Mackiland");
        }
        else if(xhttp.readyState == 2) { // request is sent
            requestsNum++;
            console.log("Request Sent! " + requestsNum);
        }
    }
    xhttp.open("GET", `https://www.nationstates.net/cgi-bin/api.cgi?userAgent=${UserAgent}&q=card+markets+info;cardid=${cardID};season=${season}`);
    xhttp.send();
}

// check if a card already exists in the array of nationCards (for owning a few copies of the same card)
const exists = (a, b) =>   // -1 if not exists
  nationCards.findIndex(([first, second]) => 
    (first === a && second === b)
  );
function readNationXML(xhttpResponse) {
    var xmlFile = xhttpResponse.responseXML;
    var ids = xmlFile.getElementsByTagName("CARDID");
    var seasons = xmlFile.getElementsByTagName("SEASON");
    var len = ids.length;
    nationCardsNumber = len;
    for(var i = 0; i < len; i++) {
        if(exists(ids[i].innerHTML, seasons[i].innerHTML) == -1)
            nationCards.push([ids[i].innerHTML, seasons[i].innerHTML]);
    }
    uniqueNationCardsNumber = nationCards.length;
    console.log(`N of cards: ${nationCardsNumber}\nUnique: ${uniqueNationCardsNumber}`)
}

function GetCardOwnerCount(xhttpResponse, cardID, season) {
    var xmlFile = xhttpResponse.responseXML;
    var cardName = xmlFile.getElementsByTagName("NAME")[0].innerHTML;
    var cardSeason = xmlFile.getElementsByTagName("SEASON")[0].innerHTML;
    var cardJunkPrice = junkPrices[xmlFile.getElementsByTagName("CATEGORY")[0].innerHTML];
    var cardMV = parseFloat(xmlFile.getElementsByTagName("MARKET_VALUE")[0].innerHTML);
    var cardBidsOverMV = new Array();
    var cardBidsOverJP = new Array();
    var cardAsks = new Array();
    
    var type = xmlFile.getElementsByTagName("TYPE");
    var price = xmlFile.getElementsByTagName("PRICE");
    
    var flagMV = false; // flagMV = true when bid > MV
    var len = type.length - 1;
    for(var i = 0; i < len; i++) {
        var p = price[i].innerHTML; 
        if(type[i].innerHTML == "bid") {
            if(p > cardMV) {
                cardBidsOverMV.push(p);
                flagMV = true;
            }
            else if(p > cardJunkPrice) // if bid is not over MV then check if it is over JP
                cardBidsOverJP.push(p)
        }
        else cardAsks.push(p);
    }

    var minAsk;
    var maxBid;

    if(cardBidsOverMV.length){
        maxBid = parseFloat(cardBidsOverMV[0]);
        for(var i = 1; i < cardBidsOverMV.length; i++) {
            if(parseFloat(cardBidsOverMV[i]) > maxBid) maxBid = parseFloat(cardBidsOverMV[i]);
        }
    }
    else if (cardBidsOverJP.length) {
        maxBid = parseFloat(cardBidsOverJP[0]);
        for(var i = 1; i < cardBidsOverJP.length; i++) {
            if(parseFloat(cardBidsOverJP[i]) > maxBid) maxBid = parseFloat(cardBidsOverJP[i]);
        }
    }
    if(cardBidsOverMV.length || cardBidsOverJP.length){
        minAsk = parseFloat(cardAsks[0]);
        for(var i = 1; i < cardAsks.length; i++) {
            if(parseFloat(cardAsks[i]) < minAsk) minAsk = parseFloat(cardAsks[i]);
        }
        cardCount++; 
        cardData = [cardCount, `<a href="https://www.nationstates.net/page=deck/card=${cardID}/season=${season}" target="_blank">${cardName}</a>`, cardSeason, minAsk, maxBid, cardMV, cardJunkPrice, flagMV];

    }

}

function getNationCardsMarketData() {

    startButton.disabled = true;
    pauseButton.disabled = false;
    contButton.disabled = true;

    nationInput.disabled = true;

    var timeNow = new Date().getTime();
    for(var i = 0; i < 40; i++) {
        requestTimes[i] = timeNow + (i + 1) * 1200;
    }
    getNationCards();
    makeMarketRequest();
}

// I borrowed some code enclosed with ///// from Wolfram and Hart (https://www.nationstates.net/nation=wolfram_and_hart).
//See his work here: https://forum.nationstates.net/viewtopic.php?f=12&t=423382&start=48
///////
function makeMarketRequest() {
    var delay;
    var timeNow = new Date().getTime();
    requestTimes.push(timeNow + 30000);
    delay = requestTimes.shift() - timeNow;
    if (delay < 0) { delay = 1; };
    var t = setTimeout(function(){
        if(nationCards.length) {
            getCardDataRequest(nationCards[0][0], nationCards[0][1]);
            nationCards.shift();
            document.getElementById("processed").innerHTML = `${nation} has ${nationCardsNumber} cards.<br>${uniqueNationCardsNumber} is unique! <br>`
            document.getElementById("processed").innerHTML += `Processed ${processedCardsNumber+1}/${uniqueNationCardsNumber} cards!`
            if(processedCardsNumber == uniqueNationCardsNumber - 1) {
                document.getElementById("processed").innerHTML = `DONE!`;
                pauseButton.disabled = true;
                nationInput.disabled = false;
            }
        } else clearTimeout(t);
        }, delay);
    if(cardData.length) createTable();
}
///////////

function pause() {

    startButton.disabled = true;
    pauseButton.disabled = true;
    contButton.disabled = false;
    nationInput.disabled = false;

    nationCardsPaused = nationCards;
    nationCards = [];
}
function cont() {

    startButton.disabled = true;
    pauseButton.disabled = false;
    contButton.disabled = true;

    nationInput.disabled = true;

    var timeNow = new Date().getTime();
    for(var i = 0; i < 40; i++) {
        requestTimes[i] = timeNow + (i + 1) * 1200;
    }
    nationCards = nationCardsPaused;
    makeMarketRequest();
}
