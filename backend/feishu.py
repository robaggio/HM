import requests
import logging
from urllib import parse

# const
# open api capability
USER_ACCESS_TOKEN_URI = "/open-apis/authen/v1/access_token"
APP_ACCESS_TOKEN_URI = "/open-apis/auth/v3/app_access_token/internal"
USER_INFO_URI = "/open-apis/authen/v1/user_info"
TENANT_ACCESS_TOKEN_URI = "/open-apis/auth/v3/tenant_access_token/internal"
JSAPI_TICKET_URI = "/open-apis/jssdk/ticket/get"

class Feishu(object):
    def __init__(self, feishu_host, app_id, app_secret):
        self.feishu_host = feishu_host
        self.app_id = app_id
        self.app_secret = app_secret
        self._app_access_token = ""
        self._user_access_token = ""

    def get_ticket(self):
        # 获取jsapi_ticket，具体参考文档：https://open.feishu.cn/document/ukTMukTMukTM/uYTM5UjL2ETO14iNxkTN/h5_js_sdk/authorization
        self.authorize_tenant_access_token()
        url = "{}{}".format(self.feishu_host, JSAPI_TICKET_URI)
        headers = {
            "Authorization": "Bearer " + self.tenant_access_token,
            "Content-Type": "application/json",
        }
        resp = requests.post(url=url, headers=headers)
        Feishu._check_error_response(resp)
        return resp.json().get("data").get("ticket", "")

    def authorize_tenant_access_token(self):
        # 获取tenant_access_token，基于开放平台能力实现，具体参考文档：https://open.feishu.cn/document/ukTMukTMukTM/ukDNz4SO0MjL5QzM/auth-v3/auth/tenant_access_token_internal
        url = "{}{}".format(self.feishu_host, TENANT_ACCESS_TOKEN_URI)
        req_body = {"app_id": self.app_id, "app_secret": self.app_secret}
        response = requests.post(url, req_body)
        Feishu._check_error_response(response)
        self.tenant_access_token = response.json().get("tenant_access_token")

    @property
    def user_access_token(self):
        return self._user_access_token

    @property
    def app_access_token(self):
        return self._app_access_token

    def authorize_user_access_token(self, code):
        # 获取 user_access_token, 依托于飞书开放能力实现. 
        # 文档链接: https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/authen/access_token
        self.authorize_app_access_token()
        url = self._gen_url(USER_ACCESS_TOKEN_URI)
        # “app_access_token” 位于HTTP请求的请求头
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + self.app_access_token,
        }
        # 临时授权码 code 位于HTTP请求的请求体
        req_body = {"grant_type": "authorization_code", "code": code}
        response = requests.post(url=url, headers=headers, json=req_body)
        Feishu._check_error_response(response)
        self._user_access_token = response.json().get("data").get("access_token")

    def get_user_info(self):
        # 获取 user info, 依托于飞书开放能力实现.  
        # 文档链接: https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/authen/user_info
        url = self._gen_url(USER_INFO_URI)
        # “user_access_token” 位于HTTP请求的请求头
        headers = {
            "Authorization": "Bearer " + self.user_access_token,
            "Content-Type": "application/json",
        }
        response = requests.get(url=url, headers=headers)
        Feishu._check_error_response(response)
        # 如需了解响应体字段说明与示例，请查询开放平台文档： 
        # https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/authen/access_token
        return response.json().get("data")

    def authorize_app_access_token(self):
        # 获取 app_access_token, 依托于飞书开放能力实现. 
        # 文档链接: https://open.feishu.cn/document/ukTMukTMukTM/ukDNz4SO0MjL5QzM/auth-v3/auth/app_access_token_internal
        url = self._gen_url(APP_ACCESS_TOKEN_URI)
        # "app_id" 和 "app_secret" 位于HTTP请求的请求体
        req_body = {"app_id": self.app_id, "app_secret": self.app_secret}
        response = requests.post(url, req_body)
        Feishu._check_error_response(response)
        self._app_access_token = response.json().get("app_access_token")

    def _gen_url(self, uri):
        # 拼接飞书开放平台域名feishu_host和uri
        return "{}{}".format(self.feishu_host, uri)

    @staticmethod
    def _check_error_response(resp):
        # 检查响应体是否包含错误信息
        # check if the response contains error information
        if resp.status_code != 200:
            raise resp.raise_for_status()
        response_dict = resp.json()
        code = response_dict.get("code", -1)
        if code != 0:
            logging.error(response_dict)
            raise FeishuException(code=code, msg=response_dict.get("msg"))

class FeishuException(Exception):
    # 处理并展示飞书侧返回的错误码和错误信息
    def __init__(self, code=0, msg=None):
        self.code = code
        self.msg = msg

    def __str__(self) -> str:
        return "{}:{}".format(self.code, self.msg)

    __repr__ = __str__
