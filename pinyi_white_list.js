/*
new Env('品易IP白名单');
55 23 * * * 
pinyi_white_list.js
by:Shuai
品易自动加白名单
*/

const fs = require('fs');
const request = require('request');

// 配置业务编号 (neek) 和 API 密钥 (appkey)
let neek = process.env.PINYI_NEEK || '请输入你的业务编号';
let appkey = process.env.PINYI_APPKEY || '请输入你的API密钥';

const ipFileName = 'pinyiIp.txt';
const checkIpUrls = [
  'http://ip-api.com/json',
  'https://checkip.synology.com/',
  'http://httpbin.org/ip'
];

// 读取保存的IP
const readSavedIp = () => fs.existsSync(ipFileName) ? fs.readFileSync(ipFileName, 'utf8').trim() : null;

// 保存IP
const saveIp = (ip) => fs.writeFileSync(ipFileName, ip);

// 获取当前IP
const getCurrentIp = async () => {
  for (let url of checkIpUrls) {
    try {
      const currentIp = await new Promise((resolve, reject) => {
        request.get({ url, timeout: 5000 }, (err, res, body) => {
          if (err) {
            reject(err);
          } else {
            const match = body.match(/((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)/);
            resolve(match ? match[0] : null);
          }
        });
      });
      if (currentIp) {
        const emojis = ['😊', '🚀', '🎉', '👍', '💡'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        console.log(`${randomEmoji} 当前IP: ${currentIp}`);
        return currentIp;
      }
    } catch (err) {
      console.log(`❗ 获取IP失败: ${err.code}`);
    }
  }
  return null;
};

// 添加IP到白名单
const addIpToWhiteList = async (ip) => {
  const url = `https://pycn.yapi.py.cn/index/index/save_white?neek=${neek}&appkey=${appkey}&white=${ip}`;
  request.get(url, (err, res, body) => {
    if (err) {
      console.log(`❗ 添加IP失败: ${err}`);
    } else if (body.includes('success')) {
      console.log(`🎉 IP已成功添加到白名单: ${ip}`);
    } else {
      console.log(`❗ 添加IP失败: ${body}`);
    }
  });
};

// 删除白名单中的IP
const delWhiteIp = async (ip) => {
  const url = `https://pycn.yapi.py.cn/index/index/del_white?neek=${neek}&appkey=${appkey}&white=${ip}`;
  request.get(url, (err, res, body) => {
    if (err) {
      console.log(`❗ 删除IP失败: ${err}`);
    } else {
      console.log(`🗑️ 已删除白名单中的IP: ${ip}`);
    }
  });
};

// 获取白名单IP列表
const getWhiteIpList = async () => {
  const url = `https://pycn.yapi.py.cn/index/index/white_list?neek=${neek}&appkey=${appkey}`;
  return await new Promise((resolve, reject) => {
    request.get(url, (err, res, body) => {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
};

// 主流程
const main = async () => {
  const currentIp = await getCurrentIp();
  if (!currentIp) {
    console.log('❗ 无法获取当前IP，终止执行！');
    return;
  }

  const savedIp = readSavedIp();
  const whiteIpList = await getWhiteIpList();

  if (savedIp && savedIp !== currentIp && whiteIpList.includes(savedIp)) {
    await delWhiteIp(savedIp);
  }

  if (!whiteIpList.includes(currentIp)) {
    await addIpToWhiteList(currentIp);
    saveIp(currentIp);
  } else {
    console.log('😎 当前IP已在白名单中，无需添加。');
  }
};

main();
