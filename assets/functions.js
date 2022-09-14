export function getCurrentPayDate() {
  function toMonthName(monthNumber) {
    const date = new Date();
    date.setMonth(monthNumber - 1);

    return date.toLocaleString("es-MX", {
      month: "long",
    });
  }

  const actualDate = new Date().toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
  });

  const [date, time] = actualDate.split(",");
  const [day, month, year] = date.split("/");

  let actualPaymentPeriod = "";

  if (day >= 1 && day <= 15) {
    actualPaymentPeriod = `1 a 15 de ${toMonthName(month)} ${year}`;
  }

  if (day > 15) {
    actualPaymentPeriod = `16 a fin de mes de ${toMonthName(month)} ${year}`;
  }

  return actualPaymentPeriod;
}

export function tableToCSV(tableID) {
  // Variable to store the final csv data

  var csv_data = [];

  // Get each row data
  var rows = document.querySelectorAll(`#${tableID} tr`);
  for (var i = 0; i < rows.length; i++) {
    // Get each column data
    var cols = rows[i].querySelectorAll(`#${tableID} td, #${tableID} th`);

    // Stores each csv row data
    var csvrow = [];
    for (var j = 0; j < cols.length; j++) {
      // Get the text data of each cell of
      // a row and push it to csvrow
      csvrow.push(cols[j].innerHTML);
    }

    // Combine each column value with comma
    csv_data.push(csvrow.join(","));
  }
  // combine each row data with new line character
  csv_data = csv_data.join("\n");

  /* We will use this function later to download
      the data in a csv file downloadCSVFile(csv_data);
      */
  return csv_data;
}

export function downloadCSVFile(csv_data) {
  // Create CSV file object and feed our
  // csv_data into it
  const blob = new Blob([csv_data], { type: "text/csv" });
  console.log(blob);

  // Creating an object for downloading url
  const url = window.URL.createObjectURL(blob);

  // Creating an anchor(a) tag of HTML
  const a = document.createElement("a");

  // Passing the blob downloading url
  a.setAttribute("href", url);

  // Setting the anchor tag attribute for downloading
  // and passing the download file name
  a.setAttribute("download", "trypInventory.csv");

  // Performing a download with click
  a.click();
}

//Funcion para llamar a cualquier API
export async function callAPI(urlAPI, params = null) {
  const response = params ? await fetch(urlAPI, params) : await fetch(urlAPI);
  const data = await response.json();
  return data;
}

export function dateFormat(inputDate, format) {
  //parse the input date
  const date = new Date(inputDate);

  //extract the parts of the date
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  //replace the month
  format = format.replace("MM", month.toString().padStart(2, "0"));

  //replace the year
  if (format.indexOf("yyyy") > -1) {
    format = format.replace("yyyy", year.toString());
  } else if (format.indexOf("yy") > -1) {
    format = format.replace("yy", year.toString().substr(2, 2));
  }

  //replace the day
  format = format.replace("dd", day.toString().padStart(2, "0"));

  return format;
}

export function getMonday(d) {
  d = new Date(d);
  d.setDate(d.getDate() + 1);

  var day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  const firstMonday = new Date(d.setDate(diff));
  return dateFormat(firstMonday, "yyyy-MM-dd");
}
