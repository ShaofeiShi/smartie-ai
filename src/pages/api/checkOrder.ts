import { verifyToken } from '../../utils/jwt'
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
    console.log(res)
  } else {
    context.cookies.delete('token', { path: '/' })
    return context.redirect('/login')
  }

  return new Response(JSON.stringify(result))
}
