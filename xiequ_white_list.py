"""
new Env('携趣IP白名单');
45 23 * * * 
xiequ_white_list.py

by: https://github.com/Twshuai/white_list.git
携趣自动加白名单
"""

import requests

# 携趣代理的用户 ID 和密钥
UID = ''
UKEY = ''
BASE_URL = "http://op.xiequ.cn/IpWhiteList.aspx"

def get_public_ip():
    """获取公共 IP 地址"""
    response = requests.get('http://ip-api.com/json')
    if response.status_code == 200:
        data = response.json()
        if data['status'] == 'success':
            return data['query']
    return None

def get_whitelist():
    """获取当前白名单 IP 列表"""
    url = f"{BASE_URL}?uid={UID}&ukey={UKEY}&act=get"
    response = requests.get(url)
    
    if response.status_code == 200:
        print("📜 当前白名单 IP 列表：")
        print(response.text)
    else:
        print("❌ 获取白名单失败，状态码：", response.status_code)

def add_ip_to_whitelist(ip_address):
    """将指定 IP 添加到白名单"""
    url = f"{BASE_URL}?uid={UID}&ukey={UKEY}&act=add&ip={ip_address}"
    response = requests.get(url)
    
    if response.status_code == 200:
        if "Err:IpOutOfLimit" in response.text:
            print("⚠️ IP 已达到上限，无法添加。请删除一些 IP 后重试。")
        else:
            print("✅ IP 添加成功！响应内容：")
            print(response.text)
    else:
        print("❌ IP 添加失败，状态码：", response.status_code)

def delete_ip_from_whitelist(ip_address):
    """从白名单中删除指定 IP"""
    url = f"{BASE_URL}?uid={UID}&ukey={UKEY}&act=del&ip={ip_address}"
    response = requests.get(url)
    
    if response.status_code == 200:
        print(f"🗑️ IP {ip_address} 删除成功，响应内容：")
        print(response.text)
    else:
        print(f"❌ IP {ip_address} 删除失败，状态码：", response.status_code)

if __name__ == "__main__":
    # 获取当前的公共 IP 地址
    public_ip = get_public_ip()
    if public_ip:
        print(f"🌐 获取到的公共 IP 是: {public_ip}")
        
        # 获取当前的白名单 IP 列表
        get_whitelist()
        
        # 添加新的 IP 到白名单
        add_ip_to_whitelist(public_ip)
    else:
        print("⚠️ 无法获取公共 IP 地址")
