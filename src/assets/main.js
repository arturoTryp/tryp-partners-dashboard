const form = document.getElementById("login-form");
const email = document.getElementById("email");
const password = document.getElementById("password");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (email.value && password.value) {
    const vendorID = await loginValidation(email.value, password.value);
    console.log(vendorID);
  }
});

async function callAPI(urlAPI, params = null) {
  const response = params ? await fetch(urlAPI, params) : await fetch(urlAPI);
  const data = await response.json();
  return data;
}

const loginValidation = async (email, password) => {
  const formula = encodeURIComponent(
    `AND({Email} = '${email}',{Password} = '${password}')`
  );

  const url = `https://api.airtable.com/v0/appsrYW53pV5fd9IT/tble27OyKDjvWH1zH?fields%5B%5D=Email&fields%5B%5D=Password&fields%5B%5D=Vendor+Name&filterByFormula=${formula}`;
  const params = {
    method: "GET",
    headers: { Authorization: "Bearer keyGwhp6yd4P08eqe" },
  };

  try {
    const loginResponse = await callAPI(url, params);
    return loginResponse.records[0].fields["Vendor Name"];
  } catch (error) {
    console.log("Error en login Validation: ", error);
  }
};
