// #vercel-disable-blocks
import { ProxyAgent, fetch } from 'undici'
import { createRequire } from "module"
// #vercel-end
import { generatePayload, parseOpenAIStream } from '@/utils/openAI'
import { verifySignature } from '@/utils/auth'
import { verifyToken } from '@/utils/jwt'
import type { APIRoute } from 'astro'
import { getApiAuthByAppIdAndSecretKey, updateApiAuthByTimes } from '../../utils/user'

const require = createRequire(import.meta.url)
const tiktoken = require('tiktoken-node')
const enc = tiktoken.encodingForModel("gpt-3.5-turbo-16k")


const apiKey = import.meta.env.OPENAI_API_KEY
const httpsProxy = import.meta.env.HTTPS_PROXY
const baseUrl = ((import.meta.env.OPENAI_API_BASE_URL) || 'https://api.openai.com').trim().replace(/\/$/, '')
// const sitePassword = import.meta.env.SITE_PASSWORD

export const post: APIRoute = async(context) => {
  const body = await context.request.json()
  const token = context.cookies.get('token').value
  const { sign, time, messages, modelType, appId, secretKey } = body
  if (!messages) {
    return new Response(JSON.stringify({
      error: {
        message: 'No input text.',
      },
    }), { status: 400 })
  }
  const apiAuth = await getApiAuthByAppIdAndSecretKey(appId, secretKey);
  if (!apiAuth) { // appId 和 secretKey 不正确
    return new Response(JSON.stringify({
      error: {
        message: 'No API Auth，Please Check appId or secretKey.',
      },
    }), { status: 400 })
  }
  if (apiAuth.times <= 0) {
    return new Response(JSON.stringify({
      error: {
        message: 'The maximum number of calls has exceeded 1000. Please contact the administrator.',
      },
    }), { status: 400 })
  }

  await updateApiAuthByTimes(appId, secretKey, apiAuth.times - 1);
   
  // 最多 15 * 1024 个tikToken，多余的截取
  let tikTokenLen = 0;
  const messageCurrent = messages.reduceRight((arr, item) => {
    if (tikTokenLen < 15 * 1024) { // 最多不能超过15 * 1024
      const tikTokenResult = enc.encode(item.content || '')
      arr.push(item)
      tikTokenLen = tikTokenLen + tikTokenResult.length
    }
    return arr;
  }, []).reverse()
  const initOptions = generatePayload(apiKey, messageCurrent, modelType)
  // #vercel-disable-blocks
  if (httpsProxy)
    initOptions.dispatcher = new ProxyAgent(httpsProxy)
  // #vercel-end

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment3w
  const response = await fetch(`${baseUrl}/v1/chat/completions`, initOptions).catch((err: Error) => {
    console.error(err)
    return new Response(JSON.stringify({
      error: {
        code: err.name,
        message: err.message,
      },
    }), { status: 500 })
  }) as Response

  return parseOpenAIStream(response) as Response
}
