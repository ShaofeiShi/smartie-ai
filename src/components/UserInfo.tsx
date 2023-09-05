import { onMount, createSignal } from 'solid-js'
export default () => {
  let inputRef: HTMLTextAreaElement
  const [userInfo, setUserInfo] = createSignal<any>({})
  const [openApiObj, setOpenApiObj] = createSignal<any>(null)
  const [initFlag, setInitFlag] = createSignal<boolean>(false)

  onMount(() => {
    checkCurrentAuth()
  })

  /**
   * 开通api功能 
   */
  const openApiAuth = async () => {
    // const password = localStorage.getItem('pass')
    const response:any = await fetch('/api/openApiAuth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
    })
    const responseJson = await response.json()
    if (responseJson.code === 0) {
        getApiInfo()
    } else {
      alert(responseJson.message)
    }
  }

  /**
   * 查询剩余次数以及密钥 
   */
  const getApiInfo = async () => {
    const response:any = await fetch('/api/getApiAuth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
    })
    const responseJson = await response.json()
    setInitFlag(true);
    if (responseJson.code === 0) {
        setOpenApiObj(responseJson.data)
    } else {
      alert(responseJson.message)
    }
  }

  const checkCurrentAuth = async ()  => {
    // const password = localStorage.getItem('pass')
    const response = await fetch('/api/auth', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const responseJson = await response.json()
 
    if (responseJson.code === 0 && responseJson.data) {
        setUserInfo(responseJson.data)
        getApiInfo()
        //document.getElementById('mainBody').style.display = 'block'
    } else {
        window.location.href = '/login'
    }
  
    // if (responseJson.code !== 0)
  
    // window.location.href = '/login'
  }

  return (
    <div my-6>
        <header class="p-5 max-w-700px mr-a ml-a">
            <div class="fb items-center relative">
            </div>
        </header>
        <main class="h-screen login-content">
            <div class="w-140">
                <div class="flex mt-4 w-full">
                    <span class="self-center w-1/5">用户名：</span>
                    <span>{userInfo().nickname}</span>
                </div>
                {
                  initFlag() ? <div>
                    {
                      openApiObj() ? 
                      <div>
                          <div class="flex mt-4 w-full">
                              <span class="self-center w-1/5">appId:</span>
                              <span>{openApiObj().appid}</span>
                          </div>
                          <div class="flex mt-4 w-full relative">
                              <span class="self-center w-1/5">密钥：</span>
                              <span class='break-all inline-block w-4/5 pr-20'>
                                  {openApiObj().secretkey}
                              </span>
                          </div>
                          <div class="flex mt-4 w-full relative">
                              <span class="self-center w-1/5">免费调用次数：</span>
                              <span class="color-red">{openApiObj().times}</span>
                          </div>
                      </div>
                      :
                      <div>
                          <button class="pt-5 block color-blue cursor-pointer" onClick={openApiAuth}>开通API开放服务</button>（开通试用有1000次调用次数，妥善保护好自己的APPID和密钥，谨防泄漏）
                      </div>
                    }
                  </div> : null
                }
                
            </div>
            {
              openApiObj() ? <textarea class='w-200 h-50 mt-10' disabled>
                {
`await fetch('/api/generateApi', {
  method: 'POST',
  body: JSON.stringify({
    "messages":[{"role":"user","content":"你好"}],
    "modelType":"3.5",
    "appId": "${openApiObj()?.appid}",
    "secretKey": "${openApiObj()?.secretkey}"
})`
                }
              </textarea> : null
            }
            
        </main>
    </div>
  )
}
