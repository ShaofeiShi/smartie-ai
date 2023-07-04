
import { createRequire } from 'module'

import { config } from '../../config'
const require = createRequire(import.meta.url)
const mysql = require('mysql2')

const pool = mysql.createPool(config.testDbConnect)
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
