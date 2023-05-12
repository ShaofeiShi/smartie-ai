import { generateToken, verifyToken } from '../../utils/jwt'
import { addNewOrder, generateOrderNo } from '../../utils/order'
import type { APIRoute } from 'astro'

export const get: APIRoute = async(context) => {
  // 从cookie中获取token
  const token = context.cookies.get('token').value
  const validateUser = verifyToken(token)
  const result = {
    code: '-1',
    message: '遇到问题请重试',
  }

  if (validateUser) {
    const orderNo = generateOrderNo(validateUser.id)
    const order = await addNewOrder(orderNo, validateUser.id)
    if (order) {
      result.code = '0'
      result.message = '订单生成成功'
      result.data = {
        orderNo,
        id: order.insertId,
        userId: validateUser.id,
      }
    }
  } else {
    context.cookies.delete('token', { path: '/' })
    return context.redirect('/login')
  }

  return new Response(JSON.stringify(result))
}
