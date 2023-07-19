import { Index, Show, createSignal, lazy, onCleanup, onMount } from 'solid-js'
import closeImg from '../../public/close.png';
import textImg from '../../public/text.png';
import reflushImg from '../../public/reflush.png';
import rightImg from '../../public/right.png';
import cancelImg from '../../public/cancel.png';

import Recorder from 'recorder-core'
//引入mp3格式支持文件；如果需要多个格式支持，把这些格式的编码引擎js文件放到后面统统引入进来即可
import 'recorder-core/src/engine/mp3'
import 'recorder-core/src/engine/mp3-engine'

enum SpeakState {
  READY, // 初始化READY状态
  START, // 按下说话状态
  STOPPING, // 手指移动到关闭按钮的状态
  TRANSLATE, TRANSLATING, TRANSLATED, // 转化文字状态
  SUCCESS, // 成功状态
  STOP,
}

let rec = null; // 录音对象
const defaultVoiceLines = [3, 5, 3, 4, 6, 12, 6, 4, 3, 5, 3, 5, 3, 4, 6, 11, 9, 7, 5]
export default ({speakOn, sendVoiceMessage}: Props) => {
  let inputRef: HTMLTextAreaElement
  const [userAllow, setUserAllow] = createSignal<boolean>(false)
  const [speakState, setSpeakState] = createSignal<SpeakState>(SpeakState.READY) // 语音全程状态 start, end, stop
  const [speakWareList, setSpeakWareList] = createSignal([...defaultVoiceLines]) // 是否语音模式

  const initSpeak = () => {
    Recorder.ConnectEnableWorklet = true
    rec = Recorder({
      type: 'mp3' //录音格式，可以换成wav等其他格式
      ,sampleRate: 16000 //录音的采样率，越大细节越丰富越细腻
      ,bitRate: 16 //录音的比特率，越大音质越好
      ,onProcess:(buffers, powerLevel) => {
        //可实时绘制波形，实时上传（发送）数据
        setSpeakWareList([...defaultVoiceLines].map((height, index) => {
          const randNum =  Math.random()
          return height + (Math.min(powerLevel, 100) * randNum / 5)
        }))
      }
    })
    rec.open(() => { //打开麦克风授权获得相关资源
      console.log('已经打开麦克风')
      setUserAllow(true)
    }, (msg, isUserNotAllow) => { //用户拒绝未授权或不支持
      setUserAllow(false)
      console.log(msg)
    })
  }
  if (speakOn) {
    initSpeak()
  };

  onMount(() => {
    window.addEventListener('contextmenu', onContextMenu)
    onCleanup(() => {
      rec.stop()
      rec = null
      window.removeEventListener('contextmenu', onContextMenu)
    })
  })

  const onContextMenu = (e) => {
    e.preventDefault();
  }

  // blob 转 File
  const blobToFile = (blob, fileName) => {
    return new File([blob], fileName, {
      type: blob.type,
      lastModified: Date.now(),
    })
  };
  // File 转 base64
  const fileToBase64Async = (file) => {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        resolve(e.target.result)
      }
    })
  }
  // 转化语音为文字 base64
  const changeAudioToText = async (blob, callback) => {
    const base64 = await fileToBase64Async(blobToFile(blob, `base.mp3`))
    console.log(base64, 'base64')
    const response = await fetch('/api/audioTranscribe', {
      method: 'POST',
      body: JSON.stringify({
        audioFile: base64
      }),
    })
    const responseJson = await response.json()
    console.log(responseJson.data.text)
    if (responseJson.code === 0) {
      callback && callback(responseJson.data.text)
      
    } else {
      console.error(responseJson.message)
      setCurrentError(responseJson.message)
      throw new Error('Request failed')
    }
  }

  const speakStart = () => {
    if (!userAllow()) return;
    setSpeakState(SpeakState.START)
    if (!rec) {
      console.error('未打开录音')
      return
    }
	  rec.start()
	  console.log('已开始录音')
  }
  const speakEnd = (callback) => {
    if (!userAllow()) return;
    if (!rec) {
      console.error('未打开录音')
      return
    }
    rec.stop((blob, duration) => {
      //简单利用URL生成本地文件地址，此地址只能本地使用，比如赋值给audio.src进行播放，赋值给a.href然后a.click()进行下载（a需提供download="xxx.mp3"属性）
      var localUrl=(window.URL||webkitURL).createObjectURL(blob)
      console.log('录音成功', blob,localUrl, '时长:' + duration + 'ms')
      
      changeAudioToText(blob, callback)
    }, (err) => {
      console.error('结束录音出错：'+err)
      callback && callback('')
    })
  }
  const onSpeakClick = () => {
    if (!userAllow()) {
      initSpeak()
    }
  }
  const onMouseCloseUp = () => {
    rec.stop()
    setSpeakState(SpeakState.STOP)
  }
  const onTranslateMouseCloseUp = () => {
    setSpeakState(SpeakState.TRANSLATING)
    speakEnd((text) => {
      setSpeakState(SpeakState.TRANSLATED)
      inputRef.value = text
    })
  }
  const sureVoiceSend = () => {
    if (inputRef.value) {
      sendVoiceMessage(inputRef.value)
    }
  }

  /** 移动端特殊处理 */
  const onTouchStart = (e) => {
    speakStart()
    e.preventDefault()
    e.stopPropagation()
  }
  const onTouchMove = (e) => {
    const status = checkInCloseContent(e)
    console.log(SpeakState[status])
    setSpeakState(status)
  }
  const onTouchEnd = (e) => {
    if (speakState() === SpeakState.START) {
      setSpeakState(SpeakState.SUCCESS)
      speakEnd((text) => {
        sendVoiceMessage(text)
      })
    } else if (speakState() === SpeakState.STOPPING) { // 滑动到了关闭按钮区域
      closeVoiceState()
    } else if (speakState() === SpeakState.TRANSLATE) {
      onTranslateMouseCloseUp()
    }
  }
  const closeVoiceState = () => {
    setSpeakState(SpeakState.READY)
    rec.stop()
  }

  const checkInCloseContent = (e) => {
    const content = document.querySelector('.gen-speak-gray')
    const speaking = document.querySelector('.gen-text-wrapper-ing')
    const { offsetWidth, offsetHeight } = content
    const { clientX, clientY } = e.targetTouches[0]
    if (offsetHeight - clientY <= speaking.offsetHeight) { // 在讲话按钮区域内
      return SpeakState.START
    } else {
      return clientX <= offsetWidth / 2 ? SpeakState.STOPPING : SpeakState.TRANSLATE
    }
  }

  return (
    <div class="w-full">
      <button class="gen-text-speak-but no-touch"
          onMouseDown={speakStart}
          onMouseUp={speakEnd}
          
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={onSpeakClick}
          >
          {
            !userAllow() ? '请刷新页面授权' : '按住说话'
          }
        </button>
        {
          speakState() === SpeakState.START 
          || speakState() === SpeakState.STOPPING 
          || speakState() === SpeakState.TRANSLATE 
          || speakState() === SpeakState.TRANSLATING
          || speakState() === SpeakState.TRANSLATED
          ?
          <div>
            <div class="gen-speak-gray gen-speak-gray-bc">
            </div>
            {
              [SpeakState.TRANSLATED].includes(speakState()) ? null : 
              <div class="gen-text-wrapper-ing line-height-20 no-touch gen-text-wrapper-ing-bc">
                {/* <span class="no-touch">松开&nbsp;发送</span> */}
              </div>
            }
            {
              [SpeakState.TRANSLATED].includes(speakState()) ? 
              <div class="gen-text-wrapper-cancle" onClick={closeVoiceState}>
                <img src={cancelImg} />
                <span class="no-touch">取消</span>
              </div> : 
              <div class={`gen-text-wrapper-close gen-text-wrapper-close-bc gen-flex-center ${speakState() === SpeakState.STOPPING ? 'gen-text-wrapper-closing' : 'gen-text-wrapper-bc'}`} onMouseUp={onMouseCloseUp}>
                <img class="gen-text-close-icon" src={closeImg}/>
                <span class="no-touch">松开&nbsp;取消</span>
              </div>
            }
            {
              [SpeakState.TRANSLATED].includes(speakState()) ? 
              <div class={`gen-text-wrapper-text gen-text-wrapper-text-bc gen-flex-center gen-text-wrapper-right`} onClick={sureVoiceSend}>
                <img src={rightImg} class="gen-text-text-right" />
              </div> : 
              <div class={`gen-text-wrapper-text gen-text-wrapper-text-bc gen-flex-center ${speakState() === SpeakState.TRANSLATE || speakState() === SpeakState.TRANSLATING ? 'gen-text-wrapper-translate' : 'gen-text-wrapper-bc'}`}
                onMouseUp={onTranslateMouseCloseUp}>
              {
                speakState() === SpeakState.TRANSLATING ? 
                <img src={reflushImg} class="gen-text-text-reflush" />
                :
                <span class="gen-text-text-icon">文</span>
              }
              <span class="tips no-touch">转文字</span>
            </div>
            }
            
          </div> : null
        }
        {
          speakState() === SpeakState.START 
          || speakState() === SpeakState.STOPPING 
          || speakState() === SpeakState.TRANSLATE 
          || speakState() === SpeakState.TRANSLATING 
          || speakState() === SpeakState.TRANSLATED ? 
          <div class={`gen-text-bar-ware gen-text-bar-ware-${speakState()}`}>
            {
              speakState() === SpeakState.TRANSLATED ?
              <textarea
                  ref={inputRef!}
                  placeholder="输入内容..."
                  autocomplete="off"
                  autofocus
                  onInput={() => {
                    inputRef.style.height = 'auto'
                    inputRef.style.height = `${inputRef.scrollHeight}px`
                  }}
                  rows="1"
                  class="gen-textarea"
              />
              :
              <div class="gen-text-bar-list">
                {
                  speakWareList().map((height) => {
                    return <i style={{'height': (height / 5) + 'rem'}}></i>
                  })
                }
              </div>
            }
           
            <div class={`gen-text-bar-arrow gen-text-bar-arrow-${speakState()}`}></div>
          </div> : null
        }
    </div>
  )
  
}
