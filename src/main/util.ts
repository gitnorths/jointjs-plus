import { Worker, WorkerOptions } from 'worker_threads'
import * as path from 'path'

export function newWorker (name: string, options: WorkerOptions = {}) {
  if (process.env.NODE_ENV === 'development') {
    return new Worker(path.resolve(path.join(__dirname, `./worker/${name}.js`)), options)
  } else {
    return new Worker(path.resolve(path.join(__dirname, `./worker/${name}.js`))
      .replace('app.asar', 'app.asar.unpacked'), options)
  }
}
