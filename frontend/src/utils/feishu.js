// Check if the app is running inside Feishu
// export const isFeishuEnvironment = () => {
//   return /feishu|lark/.test(navigator.userAgent.toLowerCase()) || 
//          window.navigator.userAgent.includes('Lark') ||
//          window.__LARK__;
// };

// Initialize Feishu JSSDK and get user info
export const initFeishuSDK = async (settings) => {
    if (settings.mock_user) {
        return new Promise((resolve, reject) => {
            fetch(`/api/public/auth/callback?code=mock`).then(response2 => response2.json().then(res2 => {
                //console.log("getUserInfo succeed",res2);
                resolve({
                    success: true,
                    userInfo: res2
                });
            }))
        });
        
    }
    if (!window.h5sdk) {
        console.error('Please open in Feishu');
        return {
            success: false
        };
    }
    // 调用config接口进行鉴权
    // window.h5sdk.config({
    //     appId: settings.appid,
    //     timestamp: settings.timestamp,
    //     nonceStr: settings.noncestr,
    //     signature: settings.signature,
    //     jsApiList: [],
    //     //鉴权成功回调
    //     onSuccess: (res) => {
    //         console.log(`config success: ${JSON.stringify(res)}`);
    //     },
    //     //鉴权失败回调
    //     onFail: (err) => {
    //         throw `config failed: ${JSON.stringify(err)}`;
    //     },
    // });

    // Configure JSSDK and get user info
    return new Promise((resolve, reject) => {

        window.h5sdk.ready(() => {
            //console.log("window.h5sdk.ready");
            console.log("url:", window.location.href);
            // Use window.tt instead of tt to avoid ESLint error
            // 调用JSAPI tt.requestAccess 获取 authorization code
            window.tt.requestAccess({
                appID: settings.appid,
                scopeList: ["contact:contact.base:readonly"],
                // 获取成功后的回调
                success(res) {
                    console.log("getAuthCode succeed");
                    //authorization code 存储在 res.code
                    // 此处通过fetch把code传递给接入方服务端Route: callback，并获得user_info
                    // 服务端Route: callback的具体内容请参阅服务端模块server.py的callback()函数
                    fetch(`/api/public/auth/callback?code=${res.code}`).then(response2 => response2.json().then(res2 => {
                        //console.log("getUserInfo succeed");
                        resolve({
                            success: true,
                            userInfo: res2
                        });
                    })).catch(function (e) {
                        console.error(e);
                        resolve({
                            success: false
                        });
                    });
                },
                // 获取失败后的回调
                fail(err) {
                    console.log(`getAuthCode failed, err:`, JSON.stringify(err));
                    resolve({
                        success: false
                    });
                }
            })
        });
    });
};