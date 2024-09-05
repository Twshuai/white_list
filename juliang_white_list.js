/*
new Env('巨量IP白名单');
55 23 * * * 
juliang_white_list.js
by:Shuai
巨量自动加白名单
*/

// 定义trade_no(业务编号)和key(提取API页面最下面)
let trade_no = '';
let key = '';

if (process.env.juliang_trade_no) {
  trade_no = process.env.juliang_trade_no;
}
if (process.env.juliang_key) {
  key = process.env.juliang_key;
}

if (trade_no == '') {
  console.log('请先定义export juliang_trade_no=(业务编号)');
  process.exit(0);
}
if (key == '') {
  console.log('请先定义export juliang_key=(api key)');
  process.exit(0);
}

const fs = require('fs');
const request = require('request');
const crypto = require('crypto');
const ipFileName = 'juliangIp.txt';

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

// 获取当前IP
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

// 添加IP到白名单
async function addIpToWhiteList(currentIP) {
  const inputString = `new_ip=${currentIP}&old_ip=${readSavedIp()}&trade_no=${trade_no}&key=${key}`;
  const sign = crypto.createHash('md5').update(inputString).digest('hex');
  const addIpUrl = `http://v2.api.juliangip.com/dynamic/replaceWhiteIp?new_ip=${currentIP}&old_ip=${readSavedIp()}&trade_no=${trade_no}&sign=${sign}`;
  
  try {
    const addIpResponse = await new Promise((resolve, reject) => {
      request.get(addIpUrl, (addIpError, addIpResponse, addIpBody) => {
        if (addIpError) {
          reject(addIpError);
        } else {
          resolve({ response: addIpResponse, body: addIpBody });
        }
      });
    });

    if (addIpResponse.body.includes('请求成功')) {
      console.log(`🎉 IP地址已更新：${currentIP}`);
      return true;
    } else {
      console.log(`❌ IP地址添加失败: ${addIpResponse.body}`);
      return false;
    }
  } catch (error) {
    console.error('💡 添加IP到白名单发生错误:', error);
    return false;
  }
}

// 获取白名单IP
async function getWhiteListIp() {
  const inputString = `trade_no=${trade_no}&key=${key}`;
  const sign = crypto.createHash('md5').update(inputString).digest('hex');
  const getIpUrl = `http://v2.api.juliangip.com/dynamic/getwhiteip?trade_no=${trade_no}&sign=${sign}`;

  try {
    const getIpResponse = await new Promise((resolve, reject) => {
      request.get(getIpUrl, (getIpError, getIpResponse, getIpBody) => {
        if (getIpError) {
          reject(getIpError);
        } else {
          resolve(getIpBody);
        }
      });
    });

    console.log('💡 获取当前白名单的响应:', getIpResponse);
    return getIpResponse;
  } catch (error) {
    console.error('💡 获取白名单发生错误:', error);
    return null;
  }
}

// 主函数
(async () => {
  const currentIP = await getCurrentIp();
  if (currentIP) {
    const whiteIP = await getWhiteListIp();
    
    if (!whiteIP.includes(currentIP)) {
      console.log('💡 当前IP不在白名单，尝试添加...');
      const result = await addIpToWhiteList(currentIP);
      if (result) {
        saveIp(currentIP);
      }
    } else {
      console.log('✅ 当前IP已在白名单');
    }
  } else {
    console.log('⚠️ 无法获取当前IP');
  }
})();
