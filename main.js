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
var requestsNum = 0;
var requestTimes = new Array();
var cardData = new Array();
var cardData = new Array();
var cardCount = 1;
var UserAgent = "userAgentNotSet";

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


function getCardDataRequest(cardID, season, maxowners) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {   
        if(xhttp.readyState == 4) { // some data received
            if(xhttp.status == 200) { // everything went OK
              var xmlFile = this.responseXML;
              var cardName = xmlFile.getElementsByTagName("NAME")[0].innerHTML;
              var owners = xmlFile.getElementsByTagName("OWNERS");
              var len = owners[0].childElementCount;
              if(len <= maxowners)
              {
                console.log(`https://www.nationstates.net/page=deck/card=${cardID}/season=${season}`, len)
                cardData = [cardCount, `<a href="https://www.nationstates.net/page=deck/card=${cardID}/season=${season}" target="_blank">${cardName}</a>`, len];
                createTable()
                cardCount++;
                console.log("card owner count request OK");
              }
              
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
    xhttp.open("GET", `https://www.nationstates.net/cgi-bin/api.cgi?userAgent=${UserAgent}&q=card+owners+info;cardid=${cardID};season=${season}`);
    xhttp.send();

    console.log(UserAgent);
}


function makeCardOwnerCountRequestDelay(id, season, maxowners) {
  var delay;
  var timeNow = new Date().getTime();
  requestTimes.push(timeNow + 30000);
  delay = requestTimes.shift() - timeNow;
  if (delay < 0) { delay = 1; };
  var t = setTimeout(function(){
    getCardDataRequest(id, season, maxowners);
      }, delay);
//  if(cardData.length) createTable();
}


function getData()
{

  var timeNow = new Date().getTime();
  for(var i = 0; i < 40; i++) {
        requestTimes[i] = timeNow + (i + 1) * 1200;
  }
  UserAgent = document.getElementById("agent").value
  nation = document.getElementById("nation").value
  maxowners = document.getElementById("maxowners").value
  getNationsCardsRequest(nation, maxowners)
}



function getNationsCardsRequest(nation, maxowners) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {   
      if(xhttp.readyState == 4) { // some data received
          if(xhttp.status == 200) { // everything went OK
            GetNationCards(this, maxowners);
            console.log("OK " + nation);
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

function GetNationCards(xhttpResponse, maxowners) {
  var xmlFile = xhttpResponse.responseXML;

  var ids = xmlFile.getElementsByTagName("CARDID");
  var seasons = xmlFile.getElementsByTagName("SEASON");
  var len = ids.length;
  console.log(len);
  for(var i = 0; i < len; i++) {
    makeCardOwnerCountRequestDelay(ids[i].innerHTML, seasons[i].innerHTML, maxowners);

  }

}


function createTable() {

  var tableHeader = new Array();
      tableHeader.push('#', 'CARD', 'Owner Count');

  // Add the header row if it is not created. 
  if(cardCount == 1 && cardData.length){
      var row = table.insertRow(-1);
      for (var i = 0; i < 3; i++) {
          var headerCell = document.createElement("TH");
          headerCell.innerHTML = tableHeader[i];
          row.appendChild(headerCell);
      }
  }
  // Add rows
  row = table.insertRow(-1);
  for (var i = 0; i < 3; i++) {
      var cell = row.insertCell(-1);
      cell.innerHTML = cardData[i];
  }

  // Add the table to the table div
  var parent = document.getElementById("myTable");
  parent.appendChild(table);
  cardData = [];
}


$(document).ready(function(){
  //clear table
var remTable = document.getElementsByTagName("TABLE");
if(remTable[0] != null){
    remTable[0].remove();
    table = document.createElement("TABLE");
    console.log("removed")       
}
// remove the process status
document.getElementById("processed").innerHTML = "";
console.log("YOO");
});