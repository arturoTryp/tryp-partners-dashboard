import tkn from "../fonts/aK.js";
import { callAPI } from "./functions.js";

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const vendorEmail = urlParams.get("vendorEmail");
const password = urlParams.get("password");

const getVendorsLogin = async (email, password) => {
  const formula = encodeURIComponent(
    `AND({Email} = '${email.toLowerCase().trim()}',{Password} = '${password}')`
  );

  const url = `https://api.airtable.com/v0/appsrYW53pV5fd9IT/tble27OyKDjvWH1zH?fields=Email&fields=Net+Vendor+Earnings+Actual+Period&fields=Total+Sold+this+period&fields=Products+Sold+on+Actual+Period&fields=Password&fields=Vendor+Name&filterByFormula=${formula}`;
  const params = {
    method: "GET",
    headers: { Authorization: tkn },
  };

  try {
    const loginResponse = await callAPI(url, params);
    return loginResponse.records[0].fields;
  } catch (error) {
    console.log("Error en login Validation: ", error);
    return null;
  }
};

const getVariantsTableData = async () => {
  const vendorsObject = await getVendorsLogin(vendorEmail, password);
  const vendorName = vendorsObject["Vendor Name"];
  console.log(vendorName);
  document.querySelector("h2").innerText = vendorName || null;

  const formula = encodeURIComponent(
    `AND(FIND('${vendorName}',ARRAYJOIN({Vendor (from Product)}, ",")),IF(FIND('[OFF]',{Variant Label})>0,0,1))`
  );

  const sortURL =
    "&sort%5B0%5D%5Bfield%5D=Piezas+Vendidas+Corte+Actual&sort%5B0%5D%5Bdirection%5D=desc";

  let API = `https://api.airtable.com/v0/appsrYW53pV5fd9IT/Variants?fields%5B%5D=Variant+Label&fields%5B%5D=Price&fields%5B%5D=Compare+At+Price&fields%5B%5D=SKU`;
  const formulaURL = `&filterByFormula=${formula}`;
  let urlAPI = API + sortURL + formulaURL;

  const params = { method: "GET", headers: { Authorization: tkn } };

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

  console.log(await tableArray);
  return await tableArray;
};

const drawTable = async () => {
  const salesArray = await getVariantsTableData();

  var formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  });

  let tableHTML = await salesArray.map((record) => {
    const name = record.fields["Variant Label"];
    const price = formatter.format(record.fields["Price"]);
    const comparePrice =
      formatter.format(record.fields["Compare At Price"]) || null;

    const sku = record.fields["SKU"];

    return `<tr>
                <th scope="row">${sku}</th>
                <td>${name}</td>
                <td>${price}</td>
                <td>${comparePrice > 0 ? comparePrice : "-"}</td>
                <td><input type="text" class="form-control" placeholder=""></input></td>
                <td><input type="text" class="form-control" placeholder=""></input></td>
            </tr>`;
  });

  try {
    document.getElementById(
      "table-body-price"
    ).innerHTML = tableHTML.toString().replaceAll(",", "");
  } catch (error) {
    console.log(error);
    document.getElementById(
      "table-body-price"
    ).innerHTML = tableHTML.toString();
  }
};

drawTable();
