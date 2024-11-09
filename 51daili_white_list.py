"""
new Env('51代理IP白名单');
45 23 * * * 
51daili_white_list.py

by: https://github.com/Twshuai/white_list.git
51代理自动加白名单
"""

import requests

# 51代理的appkey
APPKEY = 'eyJ0eXAiOiJKV1QiLCJhbGci'

# 51代理API的URL
LIST_WHITELIST_URL = f"http://bapi.51daili.com/whiteIP?op=list&appkey={APPKEY}"
ADD_WHITELIST_URL = f"http://bapi.51daili.com/whiteIP?op=add&appkey={APPKEY}"
DELETE_WHITELIST_URL = f"http://bapi.51daili.com/whiteIP?op=del&appkey={APPKEY}"

def get_public_ip():
    """获取公共IP地址"""
    response = requests.get('http://ip-api.com/json')
    if response.status_code == 200:
        data = response.json()
        if data['status'] == 'success':
            return data['query']
    return None

def list_whitelist():
    """列出当前的白名单IP"""
    response = requests.get(LIST_WHITELIST_URL)
    
    if response.status_code == 200:
        print("📜 当前白名单IP列表：")
        print(response.text)
    else:
        print("❌ 获取白名单失败，状态码：", response.status_code)

def add_ip_to_whitelist(ip_address=None):
    """
    添加IP到白名单
    如果 ip_address 为 None，将自动使用发起请求的客户端IP地址
    """
    url = f"{ADD_WHITELIST_URL}&whiteip={ip_address or ''}"
    response = requests.get(url)
    
    if response.status_code == 200:
        if "Err:IpOutOfLimit" in response.text:
            print("⚠️ IP已达到上限，正在删除所有IP...")
            delete_all_ips()
            print("🔄 尝试重新添加IP...")
            add_ip_to_whitelist(ip_address)
        else:
            print("✅ IP添加成功！响应内容：")
            print(response.text)
    else:
        print("❌ IP添加失败，状态码：", response.status_code)

def delete_all_ips():
    """删除所有白名单IP"""
    url = f"{DELETE_WHITELIST_URL}&whiteip=all"
    response = requests.get(url)
    
    if response.status_code == 200:
        print("🗑️ 所有IP删除成功，响应内容：")
        print(response.text)
    else:
        print("❌ 删除失败，状态码：", response.status_code)

def delete_ip_from_whitelist(ip_address):
    """从白名单中删除指定IP"""
    url = f"{DELETE_WHITELIST_URL}&whiteip={ip_address}"
    response = requests.get(url)
    
    if response.status_code == 200:
        print(f"🗑️ IP {ip_address} 删除成功，响应内容：")
        print(response.text)
    else:
        print(f"❌ IP {ip_address} 删除失败，状态码：", response.status_code)

if __name__ == "__main__":
    # 获取当前的公共IP地址
    public_ip = get_public_ip()
    if public_ip:
        print(f"🌐 获取到的公共IP是: {public_ip}")
        
        # 列出当前的白名单IP
        list_whitelist()
        
        # 添加新的IP到白名单
        add_ip_to_whitelist(public_ip)
    else:
        print("⚠️ 无法获取公共IP地址")
