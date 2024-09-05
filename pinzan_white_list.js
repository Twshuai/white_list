/*
new Env('品赞IP白名单');
45 23 * * * 
pinzan_white_list.js
by:Shuai
品赞自动加白名单
*/

// 定义no(业务编号)、userId(用户id)、password(登录密码)、getkey(套餐提取密匙)、signkey(签名密匙)
let no = '';
let userId = '';
let password = '';
let getkey = '';
let signkey = '';

no = process.env.PINZAN_NO || no;
userId = process.env.PINZAN_USERID || userId;
password = process.env.PINZAN_PASSWORD || password;
getkey = process.env.PINZAN_GETKEY || getkey;
signkey = process.env.PINZAN_SIGNKEY || signkey;

if (!no || !userId || !password || !getkey || !signkey) {
  console.log('❌ 请确保所有环境变量正确配置');
  process.exit(0);
}

const fs = require('fs');
const request = require('request');
const CryptoJS = require('crypto-js');
const ipFileName = 'pinzanIp.txt';

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
  console.log('📥 当前IP已保存:', ip);
}

// 获取IP的函数
async function getCurrentIp() {
  const checkIpUrls = [
    'http://ip-api.com/json',
    'https://checkip.synology.com/',
    'http://httpbin.org/ip'
  ];

  for (const url of checkIpUrls) {
    try {
      let currentIP = await new Promise((resolve, reject) => {
        request.get(url, (error, response, body) => {
          if (error) reject(error);
          else resolve(body);
        });
      });

      const ipRegex = /((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}/g;
      const match = currentIP.match(ipRegex);
      if (match) {
        console.log('🌐 当前IP:', match[0]);
        return match[0];
      }
    } catch (error) {
      console.error(`⚠️ 获取IP出错 (${url})`, error);
    }
  }
  return null;
}

// 白名单管理
async function manageWhiteList(currentIP) {
  const oldIP = readSavedIp();
  const whiteIP = await getWhiteListIp();

  if (oldIP && oldIP !== currentIP && whiteIP.includes(oldIP)) {
    console.log('⚙️ 正在删除旧IP:', oldIP);
    await removeWhiteListIp(oldIP);
  }

  if (!whiteIP.includes(currentIP)) {
    console.log('🆕 当前IP不在白名单，添加中...');
    await addIpToWhiteList(currentIP);
  } else {
    console.log('✅ 当前IP已在白名单');
  }

  if (!oldIP || oldIP !== currentIP) saveIp(currentIP);
}

// 获取白名单IP
async function getWhiteListIp() {
  const url = `https://service.ipzan.com/whiteList-get?no=${no}&userId=${userId}`;
  return new Promise((resolve, reject) => {
    request.get(url, (error, response, body) => {
      if (error) reject(error);
      else resolve(body);
    });
  });
}

// 添加IP到白名单
async function addIpToWhiteList(ip) {
  const sign = CryptoJS.AES.encrypt(
    `${password}:${getkey}:${Date.now() / 1000}`,
    CryptoJS.enc.Utf8.parse(signkey),
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
  ).ciphertext.toString();

  const url = `https://service.ipzan.com/whiteList-add?no=${no}&sign=${sign}&ip=${ip}`;
  return new Promise((resolve, reject) => {
    request.get(url, (error, response, body) => {
      if (error) {
        console.log('❌ 添加白名单失败:', error);
        reject(error);
      } else {
        console.log('🟢 添加白名单成功:', body);
        resolve();
      }
    });
  });
}

// 删除IP
async function removeWhiteListIp(ip) {
  const url = `https://service.ipzan.com/whiteList-del?no=${no}&userId=${userId}&ip=${ip}`;
  return new Promise((resolve, reject) => {
    request.get(url, (error, response, body) => {
      if (error) {
        console.log('❌ 删除白名单失败:', error);
        reject(error);
      } else {
        console.log('🟡 删除白名单IP成功:', body);
        resolve();
      }
    });
  });
}

// 主函数
(async () => {
  const currentIP = await getCurrentIp();
  if (currentIP) {
    await manageWhiteList(currentIP);
  } else {
    console.log('⚠️ 无法获取当前IP');
  }
})();
