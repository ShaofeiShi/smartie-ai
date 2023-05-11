import { sha256 } from 'js-sha256'
import jwt from 'jsonwebtoken'
import { escapeParam, queryDb } from './db'

interface AuthPayload {
  t: number
  m: string
}
interface TokenPaylout {
  id: number
  nickname: string
}

const secretKey = import.meta.env.PUBLIC_SECRET_KEY as string

export function generateToken(payload: TokenPaylout) {
  return jwt.sign(payload, secretKey, { expiresIn: '12h' })
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, secretKey)
    return decoded
  } catch (error) {
    return null
  }
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
export async function findOneUserByName(user, nick) {
  user = escapeParam(user)
  nick = escapeParam(nick)
  const sql = `select * from users where email=${user} or nickname=${nick} limit 1;`
  const result = await queryDb(sql)
  return result
}
export async function findOneUserByPwd(user, pass) {
  user = escapeParam(user)
  pass = escapeParam(pass)

  // const db = createDb()
  let sql = `select * from users where nickname=${user} and password=SHA2(${pass}, 256) limit 1;`
  if (user.includes('@'))
    sql = `select * from users where email=${user} and password=SHA2(${pass}, 256) limit 1;`

  const result = await queryDb(sql)
  return result

  // db.query(sql, (error, results, fields) => {
  //   if (error) {
  //     console.error(`error connecting: ${error.stack}`)
  //     return error
  //   }
  //   if (results.length)
  //     return results[0]
  //   else
  //     return null
  // })
}

export async function addNewUser(user, nick, pass) {
  user = escapeParam(user)
  nick = escapeParam(nick)
  pass = escapeParam(pass)

  // const db = createDb()
  const sql = `insert into users (email,password,nickname) values (${user} , SHA2(${pass}, 256),${nick} );`

  const result = await queryDb(sql)
  return result
}
