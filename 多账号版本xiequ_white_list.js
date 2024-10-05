/*
new Env('携趣IP白名单多账号版');
51 23 * * * 
xiequ_white_list.js
by:Shuai
携趣自动加白名单多账号版
*/
const fs = require('fs');
const request = require('request');

// 配置多个UID和UKEY(api提取页面下面找)
let uidList = (process.env.XIEQU_UID || '替换自己的,替换自己的').split(',');
let ukeyList = (process.env.XIEQU_UKEY || 替换自己的,替换自己的').split(',');

const ipFileName = 'xiequIp.txt';
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
        console.log(`🌐 当前IP: ${currentIp}`);
        return currentIp;
      }
    } catch (err) {
      console.log(`❗ 获取IP失败: ${err.code}`);
    }
  }
  return null;
};

// 添加IP到白名单
const addIpToWhiteList = async (uid, ukey, ip) => {
  const url = `http://op.xiequ.cn/IpWhiteList.aspx?uid=${uid}&ukey=${ukey}&act=add&ip=${ip}`;
  request.get(url, (err, res, body) => {
    if (err) {
      console.log(`❗ 添加IP失败: ${err}`);
    } else if (body.includes('success')) {
      console.log(`✅ IP已添加到白名单: ${ip} (账号: ${uid})`);
    } else {
      console.log(`❗ 添加IP失败: ${body}`);
    }
  });
};

// 删除白名单中的IP
const delWhiteIp = async (uid, ukey, ip) => {
  const url = `http://op.xiequ.cn/IpWhiteList.aspx?uid=${uid}&ukey=${ukey}&act=del&ip=${ip}`;
  request.get(url, (err, res, body) => {
    if (err) {
      console.log(`❗ 删除IP失败: ${err}`);
    } else {
      console.log(`🗑️ 删除白名单中的IP: ${ip} (账号: ${uid})`);
    }
  });
};

// 获取白名单IP列表
const getWhiteIpList = async (uid, ukey) => {
  const url = `http://op.xiequ.cn/IpWhiteList.aspx?uid=${uid}&ukey=${ukey}&act=get`;
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

  for (let i = 0; i < uidList.length; i++) {
    const uid = uidList[i];
    const ukey = ukeyList[i];

    const whiteIpList = await getWhiteIpList(uid, ukey);

    if (savedIp && savedIp !== currentIp && whiteIpList.includes(savedIp)) {
      await delWhiteIp(uid, ukey, savedIp);
    }

    if (!whiteIpList.includes(currentIp)) {
      await addIpToWhiteList(uid, ukey, currentIp);
      saveIp(currentIp);
    } else {
      console.log(`😎 当前IP已在白名单中，无需添加。 (账号: ${uid})`);
    }
  }
};

// 确保 main() 调用在函数定义之后
main();
