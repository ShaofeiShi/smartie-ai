const AlipaySdk = require('alipay-sdk')
// TypeScript，可以使用 import AlipaySdk from 'alipay-sdk';
// 普通公钥模式
const aliPaySandboxConfig = import('../../thirdConfig')

const alipaySdk = new AlipaySdk(aliPaySandboxConfig)

export const validateSign = async(sign) => {
  // 获取 queryObj，如 ctx.query, router.query
  // 如服务器未将 queryString 转化为 object，需要手动转化
  const queryObj = { sign_type: 'RSA2', sign, gmt_create: '2019-08-15 15:56:22', other_biz_field: '....' }

  // true | false
  const signRes = alipaySdk.checkNotifySign(queryObj)
  return signRes
}
export const generateAliPayOrder = async(orderNo) => {
  // out_trade_no
}
export const generateAliPay = async() => {
  const bizContent = {
    out_trade_no: 'ALIPfdf1211sdfsd12gfddsgs3',
    product_code: 'FACE_TO_FACE_PAYMENT',
    subject: 'smartieAI 包月',
    body: '234',
    total_amount: '0.01',
  }

  // 支付页面接口，返回 html 代码片段，内容为 Form 表单
  const result = alipaySdk.pageExec('alipay.trade.page.pay', {
    method: 'POST',
    bizContent,
    returnUrl: 'https://www.taobao.com',
  })
}
