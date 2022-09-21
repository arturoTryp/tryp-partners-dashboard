import {
  getCurrentPayDate,
  tableToCSV,
  downloadCSVFile,
  callAPI,
  dateFormat,
  getMonday,
} from "./functions.js";

import { drawTablePrice } from "./changePrice.js";

import hash from "../fonts/aK.js";

const loginFormContainer = document.getElementById("login-form-container");
const form = document.getElementById("login-form");
const email = document.getElementById("email");
const password = document.getElementById("password");
const submitButton = document.getElementById("submitBtn");
const maintContainer = document.getElementById("main-container");
const CVSBtnInventory = document.getElementById("download-csv-inventory");
const CVSBtnHistorico = document.getElementById("download-csv-historico");
const refreshBtn = document.getElementById("refresh-button");
const ctx = document.getElementById("myChart").getContext("2d");
const token = hash;
const buttonInventario = document.getElementById("link-inventory");
const pageTitle = document.getElementById("page-title");
const buttonHistoricoVentas = document.getElementById("link-historico");
const buttonResumen = document.getElementById("link-resumen");
const buttonCambiosPrecios = document.getElementById("link-precios");
const inventoryTableContainer = document.getElementById("inventario-container");
const resumenContainer = document.getElementById("resumen-container");
const historicoContainer = document.getElementById("historico-table-container");
const priceChangeContainer = document.getElementById(
  "price-change-table-container"
);
const vendorEmail = document.getElementById("vendor-email");

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
      vendorEmail.innerText = email.value;
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
  loginFormContainer.classList.add("inactive");
  maintContainer.classList.toggle("inactive");

  var formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  });

  drawTablePrice(email.value, password.value);

  document.getElementById("vendor-name").innerText =
    vendorObject["Vendor Name"];
  document.getElementById("pay-date").innerText = getCurrentPayDate();

  document.getElementById(
    "total-sold-highlight"
  ).innerText = `${formatter.format(vendorObject["Total Sold this period"])}`;

  document.getElementById("total-earnings").innerText = `${formatter.format(
    vendorObject["Net Vendor Earnings Actual Period"]
  )}`;

  document.getElementById(
    "pieces-amount"
  ).innerText = `${vendorObject["Products Sold on Actual Period"]}`;

  let vendorsInventoryTableArray = [];
  vendorsInventoryTableArray = await getVendorsInventoryTable(
    vendorObject["Vendor Name"]
  );

  let tableHTML = "";
  tableHTML = vendorsInventoryTableArray.map((record) => {
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

  try {
    document.getElementById(
      "table-body-inventory-data"
    ).innerHTML = tableHTML.toString().replaceAll(",", "");
  } catch (error) {
    console.log(error);
    document.getElementById(
      "table-body-inventory-data"
    ).innerHTML = tableHTML.toString();
  }

  let vendorsHistoricoSalesTable = await getHistoricSalesTable(
    vendorObject["Vendor Name"]
  );

  drawTableHistorico(await vendorsHistoricoSalesTable);
};

const drawTableHistorico = async (salesArray) => {
  var formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  });

  let tableHTML = salesArray.map((record) => {
    const precio = formatter.format(record.fields["Price"]);
    const cantidadXPrecio = formatter.format(record.fields["Quantity*Price"]);
    const comisionBase = record.fields["Comision (script)"] * 100;
    const comisionPlanMKT = record.fields["MKT Plan Comision"] * 100;
    const createdAt = dateFormat(record.fields["Created At"], "dd-MM-yy");
    const vendorNetErnings = formatter.format(
      record.fields["Vendor Net Earnings"]
    );

    return `<tr>
            <th scope="row">${record.fields["Name"]}</th>
            <td>${createdAt}</td>
            <td>${record.fields["Quantity"]}</td>
            <td>${precio}</td>
            <td>${cantidadXPrecio}</td>
            <td>${record.fields["SKU"]}</td>
            <td>${vendorNetErnings}</td>
            <td>${comisionBase}%</td>
            <td>${comisionPlanMKT}%</td>
          </tr>`;
  });
  try {
    document.getElementById(
      "table-body-historico-data"
    ).innerHTML = tableHTML.toString().replaceAll(",", "");
  } catch (error) {
    console.log(error);
    document.getElementById(
      "table-body-historico-data"
    ).innerHTML = tableHTML.toString();
  }
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

CVSBtnInventory.addEventListener("click", (e) => {
  const csvData = tableToCSV("inventory-table");
  downloadCSVFile(csvData);
});

CVSBtnHistorico.addEventListener("click", (e) => {
  const csvData = tableToCSV("historico-table");
  downloadCSVFile(csvData);
});

refreshBtn.addEventListener("click", async () => {
  const vendorObject = await getVendorsLogin(email.value, password.value);
  openAccount(vendorObject);
  maintContainer.classList.toggle("inactive");
});

const getHistoricSalesTable = async (vendorNameID) => {
  const formula = encodeURIComponent(
    `AND(FIND('${vendorNameID}',ARRAYJOIN({Vendor}, ",")),NOT(FIND('prueba',ARRAYJOIN({Tags (from Order)}, ","))))`
  );

  const sortURL =
    "&sort%5B0%5D%5Bfield%5D=Created+At&sort%5B0%5D%5Bdirection%5D=desc";

  let API = `https://api.airtable.com/v0/appsrYW53pV5fd9IT/tbl4dkYqn9YG4MHar?fields%5B%5D=Created+At&fields%5B%5D=Quantity&fields%5B%5D=Order&fields%5B%5D=Price&fields%5B%5D=Quantity*Price&fields%5B%5D=SKU&fields%5B%5D=Vendor+Net+Earnings&fields%5B%5D=Comision+(script)&fields%5B%5D=MKT+Plan+Comision&fields%5B%5D=Name`;
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
  graph(tableArray);

  return await tableArray;
};

async function graph(AraytableArray) {
  var dataArray = [];

  const nuevoArray = AraytableArray.map((m) => {
    const date = dateFormat(m.fields["Created At"][0], "yyyy-MM-dd");
    const weekBegin = getMonday(date);

    const obj = {
      date: date,
      amount: m.fields["Quantity*Price"],
      weekBegin: weekBegin,
    };
    dataArray.push(obj);
  });

  dataArray.sort((a, b) => {
    let da = new Date(a.weekBegin),
      db = new Date(b.weekBegin);
    return da - db;
  });

  console.log("Data Arra Order:");
  console.log(dataArray);

  dataArray = await groupArray(dataArray);

  console.log("Data:");
  console.log(dataArray);

  while (dataArray.length > 20) {
    dataArray.shift();
  }

  console.log("Data Shifted:");
  console.log(dataArray);

  const labels = dataArray.map((d) => d.weekBegin);
  const dataAmount = dataArray.map((d) => d.amount);

  console.log("Splited Arrays");
  console.log(labels);
  console.log(dataAmount);

  let delayed;
  const myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Ventas por semana",
          data: dataAmount,
          backgroundColor: "rgba(0, 190, 94, 0.6)",
          borderColor: "rgba(0, 190, 94, 1)",
          borderWidth: 1,
          tension: 0.3,
          fill: false,
        },
      ],
    },
    options: {
      animation: {
        onComplete: () => {
          delayed = true;
        },
        delay: (context) => {
          let delay = 0;
          if (
            context.type === "data" &&
            context.mode === "default" &&
            !delayed
          ) {
            delay = context.dataIndex * 300 + context.datasetIndex * 100;
          }
          return delay;
        },
      },
      plugins: {
        legend: {
          labels: {
            // This more specific font property overrides the global property
            font: {
              size: 10,
              family: "Avenir",
            },
          },
        },
        title: {
          display: false,
          text: "Ventas totales por semana (Max 20 semanas)",
        },
      },
      mantainAspectRatio: false,
      scales: {
        y: {
          grid: {
            color: "rgba(0, 0, 0, 0)",
            drawBorder: false,
          },
        },
        x: {
          grid: {
            color: "#F1F1F1",
            drawBorder: false,
          },
        },
      },
    },
  });
}

async function groupArray(data) {
  let result = [];
  data.reduce((res, value) => {
    if (!res[value.weekBegin]) {
      res[value.weekBegin] = { weekBegin: value.weekBegin, amount: 0 };
      result.push(res[value.weekBegin]);
    }
    res[value.weekBegin].amount += value.amount;
    return res;
  }, {});

  return result;
}

//Click on Inventario
buttonInventario.addEventListener("click", (e) => {
  buttonInventario.classList.add("activeNav");
  buttonHistoricoVentas.classList.remove("activeNav");
  buttonCambiosPrecios.classList.remove("activeNav");
  buttonResumen.classList.remove("activeNav");

  priceChangeContainer.classList.add("inactive");
  inventoryTableContainer.classList.remove("inactive");
  historicoContainer.classList.add("inactive");
  resumenContainer.classList.add("inactive");

  pageTitle.innerText = "Inventario";
});

//Click on Resumen
buttonResumen.addEventListener("click", (e) => {
  buttonInventario.classList.remove("activeNav");
  buttonHistoricoVentas.classList.remove("activeNav");
  buttonCambiosPrecios.classList.remove("activeNav");
  buttonResumen.classList.add("activeNav");

  inventoryTableContainer.classList.add("inactive");
  priceChangeContainer.classList.add("inactive");
  historicoContainer.classList.add("inactive");
  resumenContainer.classList.remove("inactive");

  pageTitle.innerText = "Resumen";
});

//Click on Historico
buttonHistoricoVentas.addEventListener("click", (e) => {
  buttonInventario.classList.remove("activeNav");
  buttonHistoricoVentas.classList.add("activeNav");
  buttonCambiosPrecios.classList.remove("activeNav");
  buttonResumen.classList.remove("activeNav");

  inventoryTableContainer.classList.add("inactive");
  resumenContainer.classList.add("inactive");
  historicoContainer.classList.remove("inactive");
  priceChangeContainer.classList.add("inactive");

  pageTitle.innerText = "Ventas históricas";
});

// click en Pricechange

buttonCambiosPrecios.addEventListener("click", (e) => {
  buttonInventario.classList.remove("activeNav");
  buttonHistoricoVentas.classList.remove("activeNav");
  buttonCambiosPrecios.classList.add("activeNav");
  buttonResumen.classList.remove("activeNav");

  inventoryTableContainer.classList.add("inactive");
  resumenContainer.classList.add("inactive");
  historicoContainer.classList.add("inactive");
  priceChangeContainer.classList.remove("inactive");

  pageTitle.innerText = "Cambio de precios";
});
