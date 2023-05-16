import { generateToken, verifyToken } from '../../utils/jwt'
import { getNewOrder, updateOrder } from '../../utils/order'
import { generateAliPay } from '../../utils/alipay'
import type { APIRoute } from 'astro'

export const post: APIRoute = async(context) => {
  // 从cookie中获取token
  const token = context.cookies.get('token').value
  const validateUser = verifyToken(token)
  const result = {
    code: '-1',
    message: '遇到问题请重试',
  }

  if (validateUser) {
    const orderNo = await getNewOrder(validateUser.id)
    // const order = await addNewOrder(orderNo, validateUser.id)
    if (orderNo) {
      const createBiz = await generateAliPay(orderNo)
      console.log(createBiz)
      if (createBiz && createBiz.qr_codeImg && createBiz.qr_code) {
        const orderResult = await updateOrder(orderNo, createBiz.qr_code)

        if (orderResult) {
          result.code = '0'
          result.message = '订单生成成功'
          result.data = {
            orderNo,
            qrCodeImg: createBiz.qr_codeImg,
            //   id: order.insertId,
            userId: validateUser.id,
          }
        }
      }
    }
  } else {
    context.cookies.delete('token', { path: '/' })
    return context.redirect('/login')
  }

  return new Response(JSON.stringify(result))
}
