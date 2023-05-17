import { updateOrderPay } from '@/utils/order'
import { updateUserPeriod } from '@/utils/user'
import { generateToken, verifyToken } from '../../utils/jwt'
import { checkAliPayOrder } from '../../utils/alipay'
import type { APIRoute } from 'astro'

export const get: APIRoute = async(context) => {
  const requestParams = await context.url.searchParams

  const orderNo = requestParams.get('orderNo')

  // 从cookie中获取token
  const token = context.cookies.get('token').value
  const validateUser = verifyToken(token)
  const result = {
    code: '-1',
    message: '遇到问题请重试',
  }

  if (validateUser) {
    const res = await checkAliPayOrder(orderNo)

    if (res && res.trade_no) {
      result.code = '0'
      result.message = '支付成功'
      const alipay_trade_no = res.trade_no
      const out_trade_no = res.out_trade_no
      const pay_amount = res.buyer_pay_amount
      const payStatus = await updateOrderPay(out_trade_no, alipay_trade_no, pay_amount)
      const userStatus = await updateUserPeriod(validateUser.id)
      if (payStatus && userStatus) {
        result.code = '0'
        result.message = '支付成功'
        result.data = {
          orderNo: out_trade_no,
          alipay_trade_no,
          pay_amount,
        }

        const token = generateToken({
          id: validateUser.id,
          username: validateUser.username,
          period: new Date().getTime() + 365 * 24 * 60 * 60 * 1000,
        })
        context.cookies.set('token', token, { path: '/' })
      }
    }
  } else {
    context.cookies.delete('token', { path: '/' })
    return context.redirect('/login')
  }

  return new Response(JSON.stringify(result))
}
