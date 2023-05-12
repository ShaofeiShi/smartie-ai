import { escapeParam, queryDb } from './db'

// 生成订单号，规则：年月日时分秒+3位客户id+3位随机数
export function generateOrderNo(id) {
  const date = new Date()
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  const second = date.getSeconds().toString().padStart(2, '0')
  const userId = id.toString().padStart(3, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${year}${month}${day}${hour}${minute}${second}${userId}${random}`
}

// 生成订单
export async function addNewOrder(orderNo, userId) {
  const sql = `
        INSERT INTO orders (order_no,user_id,total_amount,payment_amount)
        VALUES (${orderNo}, ${userId}, 0.01, 0.00)
    `
  return await queryDb(sql)
}
