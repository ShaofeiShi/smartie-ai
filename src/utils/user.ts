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
