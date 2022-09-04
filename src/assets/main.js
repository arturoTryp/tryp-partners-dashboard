const loginFormContainer = document.getElementById("login-form-container");
const form = document.getElementById("login-form");
const email = document.getElementById("email");
const password = document.getElementById("password");
const submitButton = document.getElementById("submitBtn");
const maintContainer = document.getElementById("main-container");
const downloadCSVBtn = document.getElementById("download-csv-inventory");
const refreshBtn = document.getElementById("refresh-button");
const token = "Bearer keyGwhp6yd4P08eqe";

//Validacion del Login
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (email.value && password.value) {
    const vendorObject = await getVendorsLogin(email.value, password.value);

    if (!vendorObject) {
      submitButton.value = "Datos Incorrectos";
      submitButton.classList.toggle("login-button-error");
      setTimeout(() => {
        submitButton.value = "Iniciar Sesión";
        submitButton.classList.toggle("login-button-error");
      }, 3000);
    }
    //Si se cumple la validación de datos llamamos a openAccount
    if (vendorObject) {
      openAccount(vendorObject);
    }
  } else {
    email.value ? null : email.classList.add("input_error");
    password.value ? null : password.classList.add("input_error");

    setTimeout(() => {
      email.value ? null : email.classList.remove("input_error");
      password.value ? null : password.classList.remove("input_error");
    }, 3000);
  }
});

//Funcion para llamar a cualquier API
async function callAPI(urlAPI, params = null) {
  const response = params ? await fetch(urlAPI, params) : await fetch(urlAPI);
  const data = await response.json();
  return data;
}

//Llamada del API del Login para validar credenciales
const getVendorsLogin = async (email, password) => {
  const formula = encodeURIComponent(
    `AND({Email} = '${email}',{Password} = '${password}')`
  );

  const url = `https://api.airtable.com/v0/appsrYW53pV5fd9IT/tble27OyKDjvWH1zH?fields=Email&fields=Net+Vendor+Earnings+Actual+Period&fields=Total+Sold+this+period&fields=Products+Sold+on+Actual+Period&fields=Password&fields=Vendor+Name&filterByFormula=${formula}`;
  const params = {
    method: "GET",
    headers: { Authorization: token },
  };

  try {
    const loginResponse = await callAPI(url, params);
    return loginResponse.records[0].fields;
  } catch (error) {
    console.log("Error en login Validation: ", error);
    return null;
  }
};

const getVendorsInventoryTable = async (vendorNameID) => {
  const formula = encodeURIComponent(
    `AND(FIND('${vendorNameID}',ARRAYJOIN({Vendor (from Product)}, ",")),IF(FIND('[OFF]',{Variant Label})>0,0,1))`
  );

  const sortURL =
    "&sort%5B0%5D%5Bfield%5D=Piezas+Vendidas+Corte+Actual&sort%5B0%5D%5Bdirection%5D=desc";

  let API = `https://api.airtable.com/v0/appsrYW53pV5fd9IT/tblb2dLlLUseh7sUj?fields%5B%5D=Variant+Label&fields%5B%5D=Inventario+Tryp+Now&fields%5B%5D=Inventario+GDL&fields%5B%5D=Total+Sales+(Periodo+Actual)&fields%5B%5D=SKU&fields%5B%5D=Price&fields%5B%5D=Total+Vendidos+(Historico)&fields%5B%5D=Vendor+(from+Product)&fields%5B%5D=Piezas+Vendidas+Corte+Actual`;
  const formulaURL = `&filterByFormula=${formula}`;
  let urlAPI = API + sortURL + formulaURL;

  const params = { method: "GET", headers: { Authorization: token } };

  const apiResponse = await callAPI(urlAPI, params);

  let tableArray = await apiResponse.records;
  let offset = apiResponse.offset || null;

  while (offset) {
    const offsetURL = `&offset=${offset}`;
    urlAPI = API + offsetURL + formulaURL;
    const apiResponse = await callAPI(urlAPI, params);
    offset = apiResponse?.offset || null;
    await tableArray.push(...apiResponse.records);
  }

  return await tableArray;
};

//Funcion para mostrar datos cuando se valida el login
const openAccount = async (vendorObject) => {
  loginFormContainer.classList.add("inactive");
  maintContainer.classList.toggle("inactive");

  var formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });

  document.getElementById("vendor-name").innerText =
    vendorObject["Vendor Name"];
  document.getElementById("pay-date").innerText = getCurrentPayDate();
  document.getElementById("total-sold").innerText = `${formatter.format(
    vendorObject["Total Sold this period"]
  )}`;

  document.getElementById("total-earnings").innerText = `${formatter.format(
    vendorObject["Net Vendor Earnings Actual Period"]
  )}`;

  document.getElementById(
    "pieces-amount"
  ).innerText = `${vendorObject["Products Sold on Actual Period"]}`;

  let vendorsTableArray = [];
  vendorsTableArray = await getVendorsInventoryTable(
    vendorObject["Vendor Name"]
  );

  let tableHTML = "";
  tableHTML = vendorsTableArray.map((record) => {
    const inventarioGDL = record.fields["Inventario GDL"] || 0;
    return `<tr>
          <th scope="row">${record.fields["Variant Label"]}</th>
          <td>${record.fields["Inventario Tryp Now"]}</td>
          <td>${inventarioGDL}</td>
          <td>${record.fields["Piezas Vendidas Corte Actual"]}</td>
          <td>${record.fields["Total Sales (Periodo Actual)"]}</td>
          <td>${record.fields["Total Vendidos (Historico)"]}</td>
        </tr>`;
  });

  document.getElementById(
    "table-body-inventory-data"
  ).innerHTML = tableHTML.toString().replaceAll(",", "");

  console.log(vendorsTableArray);
};

//Funcion para obtener STR de periodo de corte actual
function getCurrentPayDate() {
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

function tableToCSV() {
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

function downloadCSVFile(csv_data) {
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

downloadCSVBtn.addEventListener("click", (e) => {
  const csvData = tableToCSV();
  console.log(csvData);
  downloadCSVFile(csvData);
});

refreshBtn.addEventListener("click", async () => {
  const vendorObject = await getVendorsLogin(email.value, password.value);
  openAccount(vendorObject);
  maintContainer.classList.toggle("inactive");
});
