import {
  getCurrentPayDate,
  tableToCSV,
  downloadCSVFile,
  callAPI,
} from "./functions.js";

const loginFormContainer = document.getElementById("login-form-container");
const form = document.getElementById("login-form");
const email = document.getElementById("email");
const password = document.getElementById("password");
const submitButton = document.getElementById("submitBtn");
const maintContainer = document.getElementById("main-container");
const downloadCSVBtn = document.getElementById("download-csv-inventory");
const refreshBtn = document.getElementById("refresh-button");
const token = "Bearer keyGwhp6yd4P08eqe";
const buttonInventario = document.getElementById("btn-inventory");
const buttonHistoricoVentas = document.getElementById("btn-historico");
const inventoryTableContainer = document.getElementById(
  "inventory-table-container"
);
const historicoTableContainer = document.getElementById(
  "historico-table-container"
);

// import dotenv from "dotenv";
// dotenv.config({ silent: true });
// const token2 = process.env.AIRTABLE_API_TOKEN;
// console.log(token2);

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

//Funcion para mostrar datos cuando se valida el login
const openAccount = async (vendorObject) => {
  console.log("Vendor Object", vendorObject);
  loginFormContainer.classList.add("inactive");
  maintContainer.classList.toggle("inactive");

  var formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 1,
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
    const inventarioCDMX = record.fields["Inventario Tryp Now"] || 0;
    const totalVendido = formatter.format(
      record.fields["Total Sales (Periodo Actual)"]
    );

    return `<tr>
          <th scope="row">${record.fields["Variant Label"]}</th>
          <td>${inventarioCDMX}</td>
          <td>${inventarioGDL}</td>
          <td>${record.fields["Piezas Vendidas Corte Actual"]}</td>
          <td>${totalVendido}</td>
          <td>${record.fields["Total Vendidos (Historico)"]}</td>
        </tr>`;
  });

  document.getElementById(
    "table-body-inventory-data"
  ).innerHTML = tableHTML.toString().replaceAll(",", "");

  console.log(vendorsTableArray);
};

//Llamada del API del Login para validar credenciales
const getVendorsLogin = async (email, password) => {
  const formula = encodeURIComponent(
    `AND({Email} = '${email.toLowerCase().trim()}',{Password} = '${password}')`
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

buttonInventario.addEventListener("click", (e) => {
  buttonInventario.classList.toggle("active");
  buttonHistoricoVentas.classList.toggle("active");

  if (buttonInventario.classList.contains("active")) {
    inventoryTableContainer.classList.remove("inactive");
    historicoTableContainer.classList.add("inactive");
  } else {
    inventoryTableContainer.classList.add("inactive");
    historicoTableContainer.classList.remove("inactive");
  }
});

buttonHistoricoVentas.addEventListener("click", (e) => {
  buttonInventario.classList.toggle("active");
  buttonHistoricoVentas.classList.toggle("active");

  if (buttonHistoricoVentas.classList.contains("active")) {
    inventoryTableContainer.classList.add("inactive");
    historicoTableContainer.classList.remove("inactive");
  } else {
    inventoryTableContainer.classList.remove("inactive");
    historicoTableContainer.classList.add("inactive");
  }
});
