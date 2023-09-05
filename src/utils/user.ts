import { escapeParam, queryDb } from './db'

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
  const sql = `insert into users (email,password,nickname,period_time) values (${user} , SHA2(${pass}, 256),${nick}, DATE_ADD(NOW(), INTERVAL 3 DAY) );`

  const result = await queryDb(sql)
  return result
}

export async function updateUserPeriod(userId) {
  const sql = `
        UPDATE users
        SET period_time = DATE_ADD(NOW(), INTERVAL 1 YEAR)
        WHERE id = ${userId}
    `
  return await queryDb(sql)
}

/**
 * 通过email查询用户注册开放api权限信息
 */
export async function findOneUserByEmail(email) {
  email = escapeParam(email)
  // const db = createDb()
  let sql = `select * from users where email=${email} limit 1;`
  const result = await queryDb(sql)
  return result[0]
}

export async function findHasApiAuth(email) {
  const user: any = await findOneUserByEmail(email);
  let sql = `select * from openapi where user_id=${user.id} limit 1;`
  const result = await queryDb(sql)
  return result[0]
}

export async function addApiAuth(email, secretKey) {
  const user: any = await findOneUserByEmail(email);
  secretKey = escapeParam(secretKey)
  email = escapeParam(email)
  const userAuth = await getApiAuthByUserId(user.id)
  if (userAuth) return
  // 暂时appid 默认为 email
  const sql = `insert into openapi (appid,secretKey,user_id,times) values (${email}, ${secretKey}, ${user.id}, 1000 );`
  const result = await queryDb(sql)
  return result
}

export async function getApiAuthByAppIdAndSecretKey(appId, secretKey) {
  secretKey = escapeParam(secretKey)
  appId = escapeParam(appId)
  let sql = `select * from openapi where secretkey=${secretKey} and appid=${appId} limit 1;`
  const result = await queryDb(sql)
  return result[0]
}

export async function getApiAuthInfoByEmail(email) {
  const user: any = await findOneUserByEmail(email);
  let sql = `select * from openapi where user_id=${user.id} limit 1;`
  const result = await queryDb(sql)
  return result[0]
}

export async function getApiAuthByUserId(userId) {
  let sql = `select times from openapi where user_id=${userId} limit 1;`
  const result = await queryDb(sql)
  return result[0]
}

export async function updateApiAuthByTimes(appId, secretKey, times) {
  secretKey = escapeParam(secretKey)
  appId = escapeParam(appId)
  const sql = `
        UPDATE openapi
        SET times = ${times}
        WHERE appid = ${appId} and secretkey = ${secretKey}
    `
  return await queryDb(sql)
}

