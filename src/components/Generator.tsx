import { Index, Show, createSignal, lazy, onCleanup, onMount } from 'solid-js'
import { useThrottleFn } from 'solidjs-use'
import { generateSignature } from '@/utils/auth'
import IconClear from './icons/Clear'
import IconSend from './icons/Send'
// import MessageItem from './MessageItem'
import SystemRoleSettings from './SystemRoleSettings'
import ErrorMessageItem from './ErrorMessageItem'
import type { ChatMessage, ErrorMessage } from '@/types'
import speakImg from '../../public/speak.png';

import Recorder from 'recorder-core'
//引入mp3格式支持文件；如果需要多个格式支持，把这些格式的编码引擎js文件放到后面统统引入进来即可
import 'recorder-core/src/engine/mp3'
import 'recorder-core/src/engine/mp3-engine'

enum SpeakState {
  READY,
  START,
  SUCCESS,
  STOP,
}

let rec = null; // 录音对象
let touchX = 0;
let touchY = 0;
export default () => {
  let inputRef: HTMLTextAreaElement
  const [currentSystemRoleSettings, setCurrentSystemRoleSettings] = createSignal('')
  const [systemRoleEditing, setSystemRoleEditing] = createSignal(false)
  const [messageList, setMessageList] = createSignal<ChatMessage[]>([])
  const [currentError, setCurrentError] = createSignal<ErrorMessage>()
  const [currentAssistantMessage, setCurrentAssistantMessage] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [controller, setController] = createSignal<AbortController>(null)
  const [speakOn, setSpeakOn] = createSignal<boolean>(false) // 是否语音模式
  const [speakState, setSpeakState] = createSignal<SpeakState>(SpeakState.READY) // 语音全程状态 start, end, stop
  const [speakWareList, setSpeakWareList] = createSignal(Array(10).fill(10)) // 是否语音模式

  onMount(() => {
    try {
      if (localStorage.getItem('messageList'))
        setMessageList(JSON.parse(localStorage.getItem('messageList')))

      if (localStorage.getItem('systemRoleSettings'))
        setCurrentSystemRoleSettings(localStorage.getItem('systemRoleSettings'))
    } catch (err) {
      console.error(err)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('contextmenu', onContextMenu)
    onCleanup(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('contextmenu', onContextMenu)
    })
  })

  const onContextMenu = (e) => {
    e.preventDefault();
  }

  const handleBeforeUnload = () => {
    localStorage.setItem('messageList', JSON.stringify(messageList()))
    localStorage.setItem('systemRoleSettings', currentSystemRoleSettings())
  }

  const handleButtonClick = async() => {
    const inputValue = inputRef.value
    if (!inputValue || speakOn())
      return

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (window?.umami) umami.trackEvent('chat_generate')
    inputRef.value = ''
    setMessageList([
      ...messageList(),
      {
        role: 'user',
        content: inputValue,
      },
    ])
    requestWithLatestMessage()
  }

  const smoothToBottom = useThrottleFn(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }, 300, false, true)

  const requestWithLatestMessage = async() => {
    setLoading(true)
    setCurrentAssistantMessage('')
    setCurrentError(null)
    const storagePassword = localStorage.getItem('pass')
    try {
      const controller = new AbortController()
      setController(controller)
      const requestMessageList = [...messageList()]
      if (currentSystemRoleSettings()) {
        requestMessageList.unshift({
          role: 'system',
          content: currentSystemRoleSettings(),
        })
      }
      const timestamp = Date.now()
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          messages: requestMessageList,
          time: timestamp,
          pass: storagePassword,
          sign: await generateSignature({
            t: timestamp,
            m: requestMessageList?.[requestMessageList.length - 1]?.content || '',
          }),
        }),
        signal: controller.signal,
      })
      if (!response.ok) {
        const error = await response.json()
        console.error(error.error)
        setCurrentError(error.error)
        throw new Error('Request failed')
      }
      const data = response.body
      if (!data)
        throw new Error('No data')

      const reader = data.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        if (value) {
          const char = decoder.decode(value)
          if (char === '\n' && currentAssistantMessage().endsWith('\n'))
            continue

          if (char)
            setCurrentAssistantMessage(currentAssistantMessage() + char)

          smoothToBottom()
        }
        done = readerDone
      }
    } catch (e) {
      console.error(e)
      setLoading(false)
      setController(null)
      return
    }
    archiveCurrentMessage()
  }

  const archiveCurrentMessage = () => {
    if (currentAssistantMessage()) {
      setMessageList([
        ...messageList(),
        {
          role: 'assistant',
          content: currentAssistantMessage(),
        },
      ])
      setCurrentAssistantMessage('')
      setLoading(false)
      setController(null)
      inputRef.focus()
    }
  }

  const clear = () => {
    inputRef.value = ''
    inputRef.style.height = 'auto'
    setMessageList([])
    setCurrentAssistantMessage('')
    setCurrentError(null)
  }

  const stopStreamFetch = () => {
    if (controller()) {
      controller().abort()
      archiveCurrentMessage()
    }
  }

  const retryLastFetch = () => {
    if (messageList().length > 0) {
      const lastMessage = messageList()[messageList().length - 1]
      if (lastMessage.role === 'assistant')
        setMessageList(messageList().slice(0, -1))

      requestWithLatestMessage()
    }
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.isComposing || e.shiftKey)
      return

    if (e.keyCode === 13) {
      e.preventDefault()
      handleButtonClick()
    }
  }

  const renderMessageResult = () => {
    const MessageItem = lazy(() => import('./MessageItem'))
    return (<MessageItem
      role="assistant"
      message={currentAssistantMessage}
            />)
  }
  const renderMessageList = () => {
    return (<div>
      <Index each={messageList()}>
        {(message, index) => {
          const MessageItem = lazy(() => import('./MessageItem'))
          return (<MessageItem
            role={message().role}
            message={message().content}
            showRetry={() => (message().role === 'assistant' && index === messageList().length - 1)}
            onRetry={retryLastFetch}
                  />)
        }}
      </Index>
      {currentAssistantMessage() && renderMessageResult()}
            </div>)
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
  const changeAudioToText = async (blob) => {
    const base64 = await fileToBase64Async(blobToFile(blob, `base.mp3`));
    console.log(base64, 'base64')
    const response = await fetch('/api/audioTranscribe', {
      method: 'POST',
      body: JSON.stringify({
        audioFile: base64
      }),
    })
    const responseJson = await response.json()
    if (responseJson.code === 0) {
      setMessageList([
        ...messageList(),
        {
          role: 'user',
          content: responseJson.data.text,
        },
      ])
      requestWithLatestMessage()
    } else {
      console.error(responseJson.message)
      setCurrentError(responseJson.message)
      throw new Error('Request failed')
    }
  }

  const toggleInputType = () => {
    if (!speakOn() && rec === null) {
      Recorder.ConnectEnableWorklet = true
      rec = Recorder({
        type: 'mp3' //录音格式，可以换成wav等其他格式
        ,sampleRate: 16000 //录音的采样率，越大细节越丰富越细腻
        ,bitRate: 16 //录音的比特率，越大音质越好
        ,onProcess:(buffers, powerLevel) => {
          //可实时绘制波形，实时上传（发送）数据
          setSpeakWareList(Array(10).fill(10).map((height, index) => {
            const randNum =  Math.random()
            return height + (Math.min(powerLevel, 100) * randNum / 5)
          }))
        }
      })
      rec.open(() => { //打开麦克风授权获得相关资源
        console.log('已经打开麦克风')
      }, (msg, isUserNotAllow) => { //用户拒绝未授权或不支持
        console.log(msg)
      })
    }
    setSpeakOn(!speakOn())
  }

  const speakStart = () => {
    setSpeakState(SpeakState.START)
    if (!rec) {
      console.error('未打开录音')
      return
    }
	  rec.start()
	  console.log('已开始录音')
  }
  const speakEnd = () => {
    setSpeakState(SpeakState.SUCCESS)
    if (!rec) {
      console.error('未打开录音')
      return
    }
    rec.stop((blob, duration) => {
      //简单利用URL生成本地文件地址，此地址只能本地使用，比如赋值给audio.src进行播放，赋值给a.href然后a.click()进行下载（a需提供download="xxx.mp3"属性）
      var localUrl=(window.URL||webkitURL).createObjectURL(blob)
      console.log('录音成功', blob,localUrl, '时长:' + duration + 'ms')
      
      changeAudioToText(blob);
    }, (err) => {
      console.error('结束录音出错：'+err)
    })
  }
  const speakStop = () => {
    if (speakState() === SpeakState.START) {
      rec.stop()
      setSpeakState(SpeakState.STOP)
    }
  }

  /** 移动端特殊处理 */
  const onTouchStart = (e) => {
    touchX = e.targetTouches[0].screenX
    touchY = e.targetTouches[0].screenY
    speakStart()
  }
  const onTouchMove = (e) => {
    const moveY = e.targetTouches[0].screenY
    if (touchY - moveY > 20 ) {
      speakStop()
    }
  }

  return (
    <div my-6>
      <SystemRoleSettings
        canEdit={() => messageList().length === 0}
        systemRoleEditing={systemRoleEditing}
        setSystemRoleEditing={setSystemRoleEditing}
        currentSystemRoleSettings={currentSystemRoleSettings}
        setCurrentSystemRoleSettings={setCurrentSystemRoleSettings}
      />
      { renderMessageList()}
      { currentError() && <ErrorMessageItem data={currentError()} onRetry={retryLastFetch} /> }
      <Show
        when={!loading()}
        fallback={() => (
          <div class="gen-cb-wrapper">
            <span>思考中...</span>
            <div class="gen-cb-stop" onClick={stopStreamFetch}>停止</div>
          </div>
        )}
      >
        <div class="gen-text-wrapper" class:op-50={systemRoleEditing()}>
          <img class="gen-text-speak" src={speakImg} onClick={toggleInputType}/>
          {
            speakOn() ? 
            <button class="gen-text-speak-but no-touch"
              style="user-select:none;"
              onMouseDown={speakStart}
              onTouchStart={onTouchStart}
              onMouseUp={speakEnd}
              onTouchEnd={speakEnd}
              onMouseLeave={speakStop}
              onTouchMove={onTouchMove}>
              {
                speakState() === SpeakState.START ? '说话中' : '按住说话'
              }
            </button> :
              <textarea
                ref={inputRef!}
                disabled={systemRoleEditing()}
                onKeyDown={handleKeydown}
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
          }
          <button onClick={handleButtonClick} disabled={systemRoleEditing()} gen-slate-btn>
            <IconSend></IconSend>
          </button>
          <button title="Clear" onClick={clear} disabled={systemRoleEditing()} gen-slate-btn>
            <IconClear />
          </button>
        </div>
      </Show>
      {
        speakState() === SpeakState.START ? <div class="gen-text-bar-ware">
          移走取消
          <div class="gen-text-bar-list">
            {
              speakWareList().map((height) => {
                return <i style={{'height': height + 'px'}}></i>
              })
            }
          </div>
        </div> : null
      }
    </div>
  )
}
