/**
 * @OnlyCurrentDoc
 */

function sortBy(arr, key, desc = true) { if (!(desc)) { return arr.sort((a, b) => a[key] - b[key]) } return arr.sort((a, b) => b[key] - a[key]) }

function updateCurrencyFormat() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shMarket = ss.getSheetByName("Market (Mk)");
  var shHistory = ss.getSheetByName("db_history");
  var shRowTemplate = ss.getSheetByName("--do not remove--");
  var uiCurrency = ss.getRange("fiat_currency").getValue();

  var currencyFormat = {
    "USD": "[$$]#,##0.00",
    "CAD": "[$$]#,##0.00",
    "GBP": "[$£]#,##0.00",
    "EUR": "[$€]#,##0.00"
  };
  var defaultFormat = "#,##0.00";

  var selFormat = currencyFormat[uiCurrency] || defaultFormat;

  // update Market Sheet: Total Header
  ss.getRangeByName("portfolio_growth").setNumberFormat(selFormat);

  // update Market Sheet: Crypto Table
  numRows = ss.getRangeByName("portfolio_detail").getNumRows();
  a1Range_settings = [5, 9, 10, 12, 13, 16, 18, 22, 24]
    .map(nCol => ss.getRangeByName("portfolio_detail").offset(0, nCol, numRows, 1).getA1Notation());
  shMarket.getRangeList(a1Range_settings).setNumberFormat(selFormat);

  // update Row Template Sheet
  numRows = ss.getRangeByName("template_row_crypto").getNumRows();
  a1Range_settings = [5, 9, 10, 12, 13, 16, 18, 22, 24]
    .map(nCol => ss.getRangeByName("template_row_crypto").offset(0, nCol, numRows, 1).getA1Notation());
  shRowTemplate.getRangeList(a1Range_settings).setNumberFormat(selFormat);

  // update db_history Sheet
  numRows = ss.getRangeByName("db_history").getNumRows();
  a1Range_settings = [2, 3, 5, 6]
    .map(nCol => ss.getRangeByName("db_history").offset(0, nCol, numRows, 1).getA1Notation());
  shHistory.getRangeList(a1Range_settings).setNumberFormat(selFormat);
}

function beautify(number, plusSignFront = true, percent = false, dec = 2) {
  if (percent) { number = parseFloat(number) * 100; }
  if (plusSignFront) {
    return (number > 0 ? "+" : "") + parseFloat(parseFloat(number).toFixed(dec)).toLocaleString('fr')
  }
  return parseFloat(parseFloat(number).toFixed(dec)).toLocaleString('fr')
}
function safeGuardImportValidatorsJSON(urls = [], sheet = "", per_page = 250) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheet);

  var counting_success = 0;

  urls
    .map((url, i) => `${url}`)
    .forEach(function (url, i) {


      var status = false;
      var counting = 0;

      while (!(status) && counting < 3) {
        try {
          var dataIn = ImportJSON(url, undefined, "noTruncate, noInherit, debugLocation");
          const dataOut = [];
          // Validators come in as a single element array
          console.log(i, counting);
          console.log(url);
          if (!(dataIn.error)) { // console.log(dataAll);
            status = true;
            counting_success += 1;
            var header = ['Validator 1', 'Validator 2'];
            var list;
            var items;
            list = JSON.stringify(dataIn[1]);
            items = list.replace(/\"|\[|\]/g ,"");
            dataOut[0] = header;
            dataOut[1] = items.split(",")
            //for (let i = 1; i < dataIn[0].length; i++) {
            //  dataOut[0][i] = header
            //  console.log(dataOut[0], dataOut[1]);
            // }
            }


            sheet.
            getRange(1,1,dataOut.length, dataOut[0].length).
            setValues(dataOut);

        } catch (e) { console.log(e) }

        counting++;
        Utilities.sleep(1500);
      }
    });
  return counting_success
}
// Function to import prices from CoinGecko
function safeGuardImportPricesJSON(urls = [], sheet = "", per_page = 250) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheet);

  var counting_success = 0;

  urls
//    .map((url, i) => `${url}&per_page=${per_page}&page=${i + 1}`)
    .map((url, i) => `${url}`)
    .forEach(function (url, i) {


      var status = false;
      var counting = 0;

      while (!(status) && counting < 3) {
        try {
          var dataAll = ImportJSON(url, undefined, "noTruncate, noInherit, debugLocation");
          console.log(i, counting);
          console.log(url);

          if (!(dataAll.error)) { // console.log(dataAll);

            status = true;
            counting_success += 1;

            var schema = ['Id', 'Symbol', 'Name', 'Image', 'Current Price', 'Market Cap', 'Market Cap Rank', 'Fully Diluted Valuation', 'Total Volume', 'High 24h', 'Low 24h', 'Price Change 24h', 'Price Change Percentage 24h', 'Market Cap Change 24h', 'Market Cap Change Percentage 24h', 'Circulating Supply', 'Total Supply', 'Max Supply', 'Ath', 'Ath Change Percentage', 'Ath Date', 'Atl', 'Atl Change Percentage', 'Atl Date', 'Roi', 'Last Updated', 'Price Change Percentage 1h In Currency', 'Price Change Percentage 24h In Currency', 'Price Change Percentage 30d In Currency', 'Price Change Percentage 7d In Currency', 'Roi Times', 'Roi Currency', 'Roi Percentage'];

            var header = dataAll[0];

            if (JSON.stringify(schema) != JSON.stringify(header)) {
              var sortarray = header.map(h => schema.indexOf(h));
              dataAll = dataAll.map(function (row) { return sortarray.map(index => row[index]) });
            }
            if (i > 0) { dataAll = dataAll.slice(1) };


            sheet
              .getRange(1 + (i * per_page) + (i > 0 ? 1 : 0), 1, dataAll.length, dataAll[0].length)
              .setValues(dataAll);
          }
          break;

        } catch (e) { console.log(e) }

        counting++;
        Utilities.sleep(1500);
      }
    });
  return counting_success
}
// Function to import gains from ethstaker.tax. Uses different method and schema from the other function
//function safeGuardImportGainsJSON(urls = [], sheet = "", per_page = 250) {
function safeGuardImportGainsJSONviaPOST(urls = [], payload, sheet = "", per_page = 250) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheet);

  var counting_success = 0;

  urls
//    .map((url, i) => `${url}&per_page=${per_page}&page=${i + 1}`)
    .map((url, i) => `${url}`)
    .forEach(function (url, i) {


      var status = false;
      var counting = 0;

      while (!(status) && counting < 3) {
        try {
          var dataAll = ImportJSONViaPost(url,  payload, "", "", "noTruncate, noInherit, debugLocation");
          //Check to see that there is only one row per day.
          var dupe = dataAll[1][5];
           for (let i = 1; i < dataAll.length; i++) {
             if (dataAll[i][5] == dupe){
               //found a dupe, save it
               dupe = dataAll[i][5]
               dataAll[i][5] = "Dupe Withdrawl Date";
               dataAll[i][6] = ""; // null out the dupe withdrawl
               console.log(dataAll[i][5],i); 
             }
               else {
                 dupe = dataAll[i][5]; 
           }
             }      
         
          console.log(i, counting);
          console.log(url);

          if (!(dataAll.error)) { // console.log(dataAll);

            status = true;
            counting_success += 1;

            // New schema for rewards info...
            var schema = [
              'Validator Rewards Validator Index', 
              'Validator Rewards Consensus Layer Rewards Date', 
              'Validator Rewards Consensus Layer Rewards Amount Wei', 
              'Validator Rewards Execution Layer Rewards Date',
              'Validator Rewards Execution Layer Rewards Amount Wei',
              'Validator Rewards Withdrawals Date',
              'Validator Rewards Withdrawals Amount Wei',
              'Validator Rewards Fees Date',
              'Validator Rewards Fees Fee Value Wei',
              'Validator Rewards Bonds Date',
              'Validator Rewards Bonds Bond Value Wei',
              'Validator Rewards Execution Layer Rewards',
              'Rocket Pool Node Rewards Date',
              'Rocket Pool Node Rewards Amount Wei',
              'Rocket Pool Node Rewards Node Address',
              'Rocket Pool Node Rewards Amount Rpl'];
            var header = dataAll[0];

            if (JSON.stringify(schema) != JSON.stringify(header)) {
              var sortarray = header.map(h => schema.indexOf(h));
              dataAll = dataAll.map(function (row) { return sortarray.map(index => row[index]) });
            }
            if (i > 0) { dataAll = dataAll.slice(1) };


            sheet
              .getRange(1 + (i * per_page) + (i > 0 ? 1 : 0), 1, dataAll.length, dataAll[0].length)
              .setValues(dataAll);
          }
          break;

        } catch (e) { console.log(e) }

        counting++;
        Utilities.sleep(1500);
      }
    });
  return counting_success
}


function getLocalNow(tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone(), format = "dd/MM/yyyy") {
  return Utilities.formatDate(new Date(), tz, format);
}

function prepareDataRange(sourceRangeName, selectCols = []) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sourceRange = ss.getRangeByName(sourceRangeName).getValues();

  sourceRange = filterRowsRange(sourceRange);

  sourceRange = resizeColsRange(sourceRange, selectCols);

  // add date to the new log
  sourceRange.forEach(i => {
    i.unshift(getLocalNow());
    i.push(getLocalNow(undefined, "yyyy-MM-dd HH:mm:ssZ"));
  });

  return sourceRange;

  function filterRowsRange(range, keep_headers = false) {
    var _r = range.filter(row => row.join("").length !== 0);

    if (keep_headers) { return _r }
    else { return _r.slice(1) }
  }

  function resizeColsRange(range, selectCols = []) {
    if (selectCols.length == 0) { return range }
    else { selectCols = selectCols.filter(el => el <= range[0].length) }

    let filteredRange = range.map((row) => selectCols.map(function (el) { return row[el] }));
    return filteredRange;
  }
}

function storeRows2Sheet(sourceRange, targetSheet) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var targetSheet = ss.getSheetByName(targetSheet);

  sourceRange.forEach(row => targetSheet.appendRow(row));

  return sourceRange;
}