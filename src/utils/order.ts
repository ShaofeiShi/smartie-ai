import { escapeParam, queryDb } from './db'

// 生成订单号，规则：年月日时分秒+3位客户id+3位随机数
async function generateOrderNo(id) {
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
async function addNewOrder(orderNo, userId) {
  const sql = `
      INSERT INTO orders (order_no,user_id,total_amount,payment_amount)
      VALUES (${orderNo}, ${userId}, 0.01, 0.00)
    `
  return await queryDb(sql)
}

export async function getNewOrder(userId) {
  const sql = `
      SELECT * FROM orders
      WHERE user_id = ${userId}
      AND status = 0 
      AND payment_qr_code_url IS NOT NULL
      AND qr_code_expiration_time BETWEEN DATE_SUB(NOW(), INTERVAL 30 MINUTE) AND NOW()
      ORDER BY id DESC LIMIT 1;
    `
  const latestOrder = await queryDb(sql)
  // const latestOrder = []
  console.log(latestOrder)
  let orderNo = ''
  if (latestOrder.length > 0) {
    orderNo = latestOrder[0].order_no
    console.log('找到可复用订单')
  } else {
    orderNo = await generateOrderNo(userId)
    const order = await addNewOrder(orderNo, userId)
    if (order) {
      console.log('订单生成成功')
    } else {
      console.error(order)
      return null
    }
  }
  return orderNo
}
// 更新订单
export async function updateOrder(order_no, payment_qr_code_url) {
  const sql = `
        UPDATE orders
        SET payment_qr_code_url = ${escapeParam(payment_qr_code_url)},qr_code_expiration_time = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
        WHERE order_no = ${order_no}
    `
  return await queryDb(sql)
}
