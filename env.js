import dotenv from "../dotenv";

dotenv.config();
const token2 = process.env.AIRTABLE_API_TOKEN;

export function getAirtableToken() {
  console.log(token2);
  return token2;
}

getAirtableToken();
