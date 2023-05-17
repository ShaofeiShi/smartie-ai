import { createRequire } from 'module'
import AlipaySdk from 'alipay-sdk'
import axios from 'axios'
import QRCode from 'qrcode'
import { config } from '../../config'

const aliConfig = config.aliPayConfig
const alipaySdk = new AlipaySdk(aliConfig)

export const validateSign = async(sign) => {
  // 获取 queryObj，如 ctx.query, router.query
  // 如服务器未将 queryString 转化为 object，需要手动转化
  const queryObj = { sign_type: 'RSA2', sign, gmt_create: '2019-08-15 15:56:22', other_biz_field: '....' }

  // true | false
  const signRes = alipaySdk.checkNotifySign(queryObj)
  return signRes
}
export const generateAliPayBiz = async(orderNo) => {
  // out_trade_no
  const result = await alipaySdk.exec('alipay.open.public.qrcode.create')

  return result
}

async function getUrl(url) {
  try {
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.error(error)
  }
  return error
}
export const generateAliPay = async(orderNo) => {
  const bizContentObj = {
    out_trade_no: orderNo,
    product_code: 'FACE_TO_FACE_PAYMENT',
    subject: 'smartieAI 包月',
    body: '234',
    total_amount: '0.01',
  }

  const alipayUrl = alipaySdk.sdkExec('alipay.trade.precreate', {
    bizContent: bizContentObj,
  })
  // 向alipayUrl发起一个get请求
  console.log(`sdkExec from: ${alipayUrl}`, alipayUrl)
  const aliRes = await getUrl(`${aliConfig.gateway}?${alipayUrl}`)
  const aliResData = null
  let result = null
  console.log(`aliRes: ${JSON.stringify(aliRes)}`)
  const validRes = alipaySdk.checkResponseSign(JSON.stringify(aliRes), 'alipay_trade_precreate_response')
  // if (validRes) {
  //   console.log('验签成功')
  // } else {
  //   console.error(`error: ${validRes}`)
  //   return result
  // }

  if (aliRes && aliRes.alipay_trade_precreate_response && aliRes.alipay_trade_precreate_response.code === '10000') {
    result = aliRes.alipay_trade_precreate_response
    const qrCodeImg = await QRCode.toDataURL(aliRes.alipay_trade_precreate_response.qr_code)
    result.qr_codeImg = qrCodeImg
  } else {
    // console.error(`error: ${JSON.stringify(aliRes)}`)
  }
  return result
  // console.log(result)
}

export const checkAliPayOrder = async(orderNo) => {
  const bizContentObj = {
    out_trade_no: orderNo,
  }
  const alipayUrl = alipaySdk.sdkExec('alipay.trade.query', {
    bizContent: bizContentObj,
  })
  // 向alipayUrl发起一个get请求
  console.log(`sdkExec from: ${alipayUrl}`, alipayUrl)
  const aliRes = await getUrl(`${aliConfig.gateway}?${alipayUrl}`)
  const aliResData = null
  let result = null
  console.log(`aliRes: ${JSON.stringify(aliRes)}`)
  const validRes = alipaySdk.checkResponseSign(JSON.stringify(aliRes), 'alipay_trade_query_response')
  if (validRes) {
    console.log('验签成功')
  } else {
    console.error(`error: ${validRes}`)
    return result
  }
  if (aliRes && aliRes.alipay_trade_query_response && aliRes.alipay_trade_query_response.code === '10000' && aliRes.alipay_trade_query_response.trade_status === 'TRADE_SUCCESS') {
    result = aliRes.alipay_trade_query_response
    // validRes = true
  } else {
    // console.error(`error: ${JSON.stringify(aliRes)}`)
  }
  return result
  // console.log(result)
}
