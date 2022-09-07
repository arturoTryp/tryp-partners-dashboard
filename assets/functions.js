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
  const [hour, min] = time.split(":");

  let actualPaymentPeriod = "";

  if (day >= 1 && day <= 15) {
    actualPaymentPeriod = `1 a 15 de ${toMonthName(month)} ${year}`;
  }

  if (day > 15) {
    actualPaymentPeriod = `16 a fin de mes de ${toMonthName(month)} ${year}`;
  }

  return actualPaymentPeriod;
}

export function tableToCSV() {
  // Variable to store the final csv data

  var csv_data = [];

  // Get each row data
  var rows = document.getElementsByTagName("tr");
  for (var i = 0; i < rows.length; i++) {
    // Get each column data
    var cols = rows[i].querySelectorAll("td,th");

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
