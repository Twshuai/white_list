/*
new Env('51代理IP白名单');
55 23 * * * 
51daili_white_list.js
by:Shuai
51代理白名单自动替换
*/

// 定义appkey（从51代理平台获取）
const appkey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.IjE1MTAyNTUxMzQyfFd1WWlEYWlMaSI.AQqgr0K6m97aurcscU0YlFMHudUKLajXC8pZrRhQ4tg';

if (!appkey) {
  console.log('❗ 请先定义appkey');
  process.exit(0);
}

// 引入模块
const fs = require('fs');
const request = require('request');
const ipFileName = '51dailiIp.txt';

// 读取保存的IP
function readSavedIp() {
  try {
    const data = fs.readFileSync(ipFileName, 'utf8');
    return data.trim();
  } catch (error) {
    return null;
  }
}

// 保存IP
function saveIp(ip) {
  fs.writeFileSync(ipFileName, ip);
}

// 获取当前IP
async function getCurrentIp(url) {
  try {
    let currentIP = await new Promise((resolve, reject) => {
      request.get(url, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(body.trim());
        }
      });
    });
    // 使用表情符号
    const emojis = ['😊', '😎', '🚀', '🎉', '👍'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const ipMatch = currentIP.match(/\d{1,3}(\.\d{1,3}){3}/);
    if (ipMatch) {
      currentIP = ipMatch[0];
      console.log(`${randomEmoji} 当前IP: ${currentIP}`);
      await delay(2000);
      return currentIP;
    } else {
      console.log('💡 未获取到有效的IP地址');
      return null;
    }
  } catch (error) {
    console.error('💡 获取当前IP发生错误:', error);
    return null;
  }
}

// 添加IP到白名单
async function addIpToWhiteList(ip) {
  const url = `http://aapi.51daili.com/whiteIP?op=add&appkey=${appkey}&whiteip=${ip}`;
  try {
    const response = await new Promise((resolve, reject) => {
      request.get(url, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
    const emojis = ['😊', '🎉'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const success = response.includes('success');
    const message = success ? `🎉 IP地址已更新：${ip}` : `💡 IP地址添加失败: ${response}`;
    console.log(`${randomEmoji} 添加IP到白名单的响应:`, response);
    await delay(2000);
    return { success, message };
  } catch (error) {
    console.error('💡 添加IP到白名单发生错误:', error);
    return { success: false, message: `💡 IP地址添加失败: ${error.message}` };
  }
}

// 删除白名单IP
async function delWhiteIp(ip) {
  const url = `http://aapi.51daili.com/whiteIP?op=del&appkey=${appkey}&whiteip=${ip}`;
  try {
    const response = await new Promise((resolve, reject) => {
      request.get(url, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
    console.log('💡 白名单中删除IP:', ip, ',', response);
    await delay(2000);
    return response;
  } catch (error) {
    console.error('💡 删除IP发生错误:', error);
    return null;
  }
}

// 获取白名单IP
async function getWhiteIp() {
  const url = `http://aapi.51daili.com/whiteIP?op=list&appkey=${appkey}`;
  try {
    const response = await new Promise((resolve, reject) => {
      request.get(url, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
    console.log('💡 获取当前白名单的响应:', response);
    await delay(2000);
    return response;
  } catch (error) {
    console.error('💡 获取白名单发生错误:', error);
    return null;
  }
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
  console.log('');
  let currentIP = await getCurrentIp('http://checkip.amazonaws.com/');
  if (!currentIP) {
    console.log('💡 使用备用IP获取方式……');
    currentIP = await getCurrentIp('http://api.ipify.org');
  }
  const oldIp = readSavedIp();
  if (currentIP) {
    const whiteIpList = await getWhiteIp();
    if (oldIp && oldIp !== currentIP) {
      if (whiteIpList && whiteIpList.includes(oldIp)) {
        await delWhiteIp(oldIp);
      }
    }
    if (whiteIpList && whiteIpList.includes(currentIP)) {
      console.log('😎 当前IP在白名单中，无需添加');
    } else {
      console.log('💡 当前IP不在白名单中，尝试添加');
      const result = await addIpToWhiteList(currentIP);
      console.log(result.message);
    }
    saveIp(currentIP);
  } else {
    console.log('💡 获取公网IP失败，终止执行！');
  }
}

main();
