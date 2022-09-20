import hash from "../fonts/aK.js";
import { callAPI } from "./functions.js";

let vendorEmail;
let password;
const tableBody = document.getElementById("table-body-price");
const sendBtn = document.getElementById("send");

const getVendorsLogin = async (email, password) => {
  const formula = encodeURIComponent(
    `AND({Email} = '${email.toLowerCase().trim()}',{Password} = '${password}')`
  );

  const url = `https://api.airtable.com/v0/appsrYW53pV5fd9IT/tble27OyKDjvWH1zH?fields=Email&fields=Net+Vendor+Earnings+Actual+Period&fields=Total+Sold+this+period&fields=Products+Sold+on+Actual+Period&fields=Password&fields=Vendor+Name&filterByFormula=${formula}`;
  const params = {
    method: "GET",
    headers: { Authorization: hash },
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
  console.log("test", vendorEmail);

  const vendorName = vendorsObject["Vendor Name"];

  const formula = encodeURIComponent(
    `AND(FIND('${vendorName}',ARRAYJOIN({Vendor (from Product)}, ",")),IF(FIND('[OFF]',{Variant Label})>0,0,1))`
  );

  const sortURL =
    "&sort%5B0%5D%5Bfield%5D=Variant+Label&sort%5B0%5D%5Bdirection%5D=asc";

  let API = `https://api.airtable.com/v0/appsrYW53pV5fd9IT/tblb2dLlLUseh7sUj?fields%5B%5D=Variant+Label&fields%5B%5D=Price&fields%5B%5D=Compare+At+Price&fields%5B%5D=SKU&fields%5B%5D=%E2%88%9E+Shopify+Id`;
  const formulaURL = `&filterByFormula=${formula}`;
  let urlAPI = API + sortURL + formulaURL;

  const params = { method: "GET", headers: { Authorization: hash } };

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

export const drawTablePrice = async (email, pwd) => {
  vendorEmail = email;
  password = pwd;
  const salesArray = await getVariantsTableData();

  var formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  });

  let tableHTML = await salesArray.map((record, index) => {
    const name = record.fields["Variant Label"];
    const price = formatter.format(record.fields["Price"]);
    const comparePrice = record.fields["Compare At Price"];
    const sku = record.fields["SKU"];
    const variantID = record.fields["∞ Shopify Id"];

    return `<tr>
                <th scope="row" style="display:none;">${variantID}</th>
                <th scope="row">${sku}</th>
                <td>${name}</td>
                <td>${price}</td>
                <td>${comparePrice > 0 ? comparePrice : "-"}</td>
                <td><input type="text" id="new-price-${index}" class="form-control" placeholder=""></input></td>
                <td><input type="text" id="new-compare-price-${index}" class="form-control" placeholder=""></input></td>
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

sendBtn.addEventListener("click", (event) => {
  const updateArray = [];

  for (let i in tableBody.rows) {
    let updateObject = {
      sku: null,
      newPrice: null,
      newComparePrice: null,
      productName: null,
      variantID: null,
    };

    for (let j in tableBody.rows[i].cells) {
      if (j == 0) {
        updateObject.variantID = tableBody.rows[i].cells[j].innerText;
      }
      if (j == 1) {
        updateObject.sku = tableBody.rows[i].cells[j].innerText;
      }
      if (j == 2) {
        updateObject.productName = tableBody.rows[i].cells[j].innerText;
      }
      if (j == 5) {
        updateObject.newPrice = document.getElementById(
          tableBody.rows[i].cells[j].children[0].id
        ).value;
      }
      if (j == 6) {
        updateObject.newComparePrice = document.getElementById(
          tableBody.rows[i].cells[j].children[0].id
        ).value;
      }
    }

    updateArray.push(updateObject);
  }

  const filteredUpdateArray = updateArray.filter(
    (m) => m.newPrice && m.newComparePrice
  );

  //Arreglo filtrado con objetos a actualizar: filteredUpdateArray
  console.log(filteredUpdateArray);
  sendToReviewAirtable(filteredUpdateArray);
});

async function sendToReviewAirtable(tableData) {
  const date = new Date();
  let data = {
    records: [],
  };

  tableData.map((record) => {
    const temporal = {
      fields: {
        variantID: record.variantID,
        SKU: record.sku,
        name: record.productName,
        newPrice: record.newPrice,
        newCompareAtPrice: record.newComparePrice,
        createdAt: `${date.getFullYear()}-${date.getUTCMonth() +
          1}-${date.getDate()}`,
      },
    };
    data.records.push(temporal);
  });

  const raw = JSON.stringify(data);

  var myHeaders = new Headers();
  myHeaders.append("Authorization", hash);
  myHeaders.append("Content-Type", "application/json");

  const params = { method: "POST", headers: myHeaders, body: raw };
  const url = "https://api.airtable.com/v0/appvva5paZYhEPUFG/Price%20Review";

  try {
    const apiResponse = await callAPI(url, params);
    alert(
      "Precios mandados a revision. Aguien del equipo de operaicones los estara revisando y actualizando en las proxmas 24 horas hábiles."
    );
  } catch (error) {
    alert(
      "Error al mandar atualizacion de precios. Compartir este mensaje con contacto@tryp.mx. Error: " +
        error
    );
  }
}
