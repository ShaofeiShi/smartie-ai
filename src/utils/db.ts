
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const mysql = require('mysql2')

const connectConfig = {
  host: 'mysql.sqlpub.com',
  user: 'edianyun',
  password: '7c126dd1f9edb592',
  database: 'smartie',
  connectTimeout: 1000,
  connectionLimit: 10,
  multipleStatements: true,
}

const pool = mysql.createPool(connectConfig)
pool.on('error', (err) => {
  throw err
  return
})

export function escapeParam(params) {
  return mysql.escape(params)
}
export function queryDb(sql) {
  console.log(sql)
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) {
        console.log(`conn error:${err}`)
        reject(err)
      } else {
        conn.query(sql, (error, rows) => {
          if (error) {
            console.log(`query error:${error}`)
            reject(error)
          } else {
            resolve(rows)
          }
          conn.release()
        })
      }
    })
  })
}
