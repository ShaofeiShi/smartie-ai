/**
 * 语音转文本
 */
import { createRequire } from "module"
import type { APIRoute } from "astro"
import { nanoid } from "nanoid"
import { config } from '../../../config'

const require = createRequire(import.meta.url)
const tencentcloud = require("tencentcloud-sdk-nodejs-asr");
const AsrClient = tencentcloud.asr.v20190614.Client;
const fs = require("fs")

const clientConfig = config.txVoiceConfig


export const post: APIRoute = async (context) => {
  // 接收request中的文件base64格式文件
  const body = await context.request.json()
  const { audioFile } = body
  
  // 实例化要请求产品的client对象,clientProfile是可选的
  const client = new AsrClient(clientConfig)
  const base64Data = audioFile.replace(/^data:audio\/\w+;base64,/, "")
  const params = {
    EngSerViceType: '16k_zh',
    SourceType: 1,
    VoiceFormat: 'mp3',
    Data: base64Data
  };
  console.log(params,'params')
  let result = {
    code: -1,
    message: '遇到问题请重试',
    data: {
      text: ''
    }
  }
  try {
    const data = await client.SentenceRecognition(params)
    result.code = 0
    result.message = '语音转化文字成功'
    result.data.text = data.Result;
    console.log(data.Result, 'prompt')
  } catch (err) {
    console.log(err, "translate file error")
  }
  return new Response(JSON.stringify(result))
}
