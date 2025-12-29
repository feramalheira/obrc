import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { Worker } from "worker_threads"
import { cpus } from "os"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const totalRows = 1e9
  const dirName = 'resources'
  const fileName = 'oneBillChall.csv'
  const workerCount = Math.min(10, cpus().length)
  const rowsPerWorker = Math.ceil(totalRows / workerCount)
  const dirPath = path.join(__dirname, dirName)
  const filePath = path.join(dirPath, fileName)
  
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
  
  await fs.writeFile(filePath, 'county;value\n')
  const workers = []
  const workerPromises = []

  for (let i = 0; i < workerCount; i++) {
    const startRow = i * rowsPerWorker
    const endRow = Math.min(startRow + rowsPerWorker, totalRows)
    const rowsForThisWorker = endRow - startRow
    const worker = new Worker(path.join(__dirname, 'worker.js'), {
      workerData: {
        workerId: i,
        rowsToGenerate: rowsForThisWorker,
        filePath
      }
    })
    
    workers.push(worker)
    const workerPromise = new Promise((resolve, reject) => {
      worker.on('message', (message) => {
        console.log(`Worker ${i}: ${message}`)
      })

      worker.on('error', reject)
      
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker ${i} stopped with exit code ${code}`))
        } else {
          resolve()
        }
      })
    })
    
    workerPromises.push(workerPromise)
  }
  
  console.log(`Starting generation of ${totalRows.toLocaleString()} rows using ${workerCount} workers...`)
  await Promise.all(workerPromises)
  workers.forEach(worker => worker.terminate())
  console.log('File generation completed!')
}

main().catch(console.error)