import { faker } from "@faker-js/faker";
import fs from "fs/promises"
import path from "node:path"
import { Buffer } from "node:buffer";

async function main() {
  const oneBill = 1e9;
  const dirName = 'resources'
  const fileName = 'oneBillChall.csv'
  const min = -10
  const max = 10
  try {
    await fs.access(path.join('./', dirName, fileName));
  } catch {
    await fs.mkdir(path.join('./', dirName), {recursive: true}, (err) => {if (err) console.log(err)})
  }
  await fs.writeFile(path.join('./', dirName, fileName), Buffer.from(''), (err) => {if(err) console.log(err)})
  for (let i = 0; i < oneBill; i++) {
    await fs.appendFile(path.join('./', dirName, fileName), Buffer.from(`${faker.location.county()};${faker.number.float({min, max, fractionDigits: 2})}\n`))
  }
}

main();

