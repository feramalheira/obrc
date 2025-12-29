import { workerData, parentPort } from 'worker_threads'
import { faker } from '@faker-js/faker'
import fs from 'node:fs'

async function generateFile() {
  const { rowsToGenerate, filePath } = workerData
  const min = -10
  const max = 10
  const writeStream = fs.createWriteStream(filePath, { flags: 'a' })
  const batchSize = 10000
  let batch = []
  let generated = 0
  
  for (let i = 0; i < rowsToGenerate; i++) {
    const county = faker.location.county()
    const value = faker.number.float({ min, max, fractionDigits: 2 })
    batch.push(`${county};${value}`)
    if (batch.length >= batchSize) {
      const canWrite = writeStream.write(batch.join('\n') + '\n')
      generated += batch.length
      if (generated % 1000000 === 0) {
        parentPort.postMessage(`Generated ${generated.toLocaleString()} rows`)
      }
      if (!canWrite) {
        await new Promise(resolve => writeStream.once('drain', resolve))
      }
      batch = []
    }
  }

  if (batch.length > 0) {
    writeStream.write(batch.join('\n') + '\n')
    generated += batch.length
  }

  await new Promise(resolve => {
    writeStream.end(() => {
      parentPort.postMessage(`Completed: ${generated.toLocaleString()} rows`)
      resolve()
    })
  })
}

generateFile().catch(error => {
  console.error(`Worker ${workerData.workerId} error:`, error)
  process.exit(1)
})