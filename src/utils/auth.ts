import { sha256 } from 'js-sha256'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const mysql = require('mysql2')
import {getConfig} from './config'

interface AuthPayload {
  t: number
  m: string
}

async function digestMessage(message: string) {
  if (typeof crypto !== 'undefined' && crypto?.subtle?.digest) {
    const msgUint8 = new TextEncoder().encode(message)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } else {
    return sha256(message).toString()
  }
}

export const generateSignature = async(payload: AuthPayload) => {
  const { t: timestamp, m: lastMessage } = payload
  const secretKey = import.meta.env.PUBLIC_SECRET_KEY as string
  const signText = `${timestamp}:${lastMessage}:${secretKey}`
  // eslint-disable-next-line no-return-await
  return await digestMessage(signText)
}

export const verifySignature = async(payload: AuthPayload, sign: string) => {
  // if (Math.abs(payload.t - Date.now()) > 1000 * 60 * 5) {
  //   return false
  // }
  const payloadSign = await generateSignature(payload)
  return payloadSign === sign
}
export async function findUser(){
  let connection = mysql.createConnection({
      "host" : 'mysql.sqlpub.com',
      "user" : 'edianyun',
      "password" : '7c126dd1f9edb592',
      "database" : 'smartie',
      "connectTimeout": 1000,
      "multipleStatements": true,
    })
  connection.connect();
  
  connection.query('select * from users limit 1', function (error, results, fields) {
    if (error){
      console.error('error connecting: ' + error.stack);
      return;
    }
    console.log('The data is: ', results[0]);
  });
}