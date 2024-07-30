import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;
const LOGIN_INFO = JSON.parse(process.env.LOGIN_INFO);

const TG_API_URL = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;

const getIPAddress = async () => {
    const response = await fetch('https://api.ipify.org/?format=json');
    const data = await response.json();
    return data.ip;
};

const getBeijingTime = () => {
    return new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(new Date()).replace(/\//g, '-');
};

const sendTelegramNotification = async (message) => {
    await fetch(TG_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TG_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        })
    });
};

const validateLoginUrl = (url) => {
    const regex = /^https:\/\/panel.*\.(com|pl)$/;
    return regex.test(url);
};

const loginAndCheck = async (user, ipAddress) => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const LOGIN_URL = `${user.login_url}/login`;
    const CHECK_URL = user.login_url;

    let attempts = 0;
    let loggedIn = false;
    const beijingTime = getBeijingTime();

    while (attempts < 3 && !loggedIn) {
        try {
            // console.log(`Attempt ${attempts + 1} for ${user.username}`);
            await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
            // console.log(`Navigated to ${LOGIN_URL}`);
            await page.type('#id_username', user.username);
            await page.type('#id_password', user.password);
            // console.log(`Entered username and password for ${user.username}`);
            await page.click('#submit');
            // console.log(`Clicked submit button for ${user.username}`);
            await page.waitForTimeout(10000);
            await page.goto(CHECK_URL, { waitUntil: 'networkidle2' });

            const title = await page.title();
            // console.log(`Page title for ${user.username}: ${title}`);

            const regexStrona = /Strona/i;
            const regexHome = /home/i;

            if (regexStrona.test(title) || regexHome.test(title)) {
                loggedIn = true;
                await browser.close();
                return `✅ ${user.username} 登录成功.\n登录面板: ${user.login_url}\n登录IP: ${ipAddress}\n登录时间: ${beijingTime}`;
            }
            attempts++;
            if (attempts < 3) await page.waitForTimeout(30000);
        } catch (error) {
            console.error(`Error during login attempt for ${user.username}:`, error);
            attempts++;
            if (attempts < 3) await page.waitForTimeout(30000);
        }
    }

    await browser.close();
    return `❌ ${user.username} 登录失败.\n登录面板: ${user.login_url}\n登录IP: ${ipAddress}\n登录时间: ${beijingTime}`;
};

const main = async () => {
    try {
        const ipAddress = await getIPAddress();
        // console.log(`Current IP Address: ${ipAddress}`);

        let combinedMessage = '';
        for (const user of LOGIN_INFO) {
            if (validateLoginUrl(user.login_url)) {
                const message = await loginAndCheck(user, ipAddress);
                combinedMessage += combinedMessage ? '\n\n' + message : message;
            } else {
                const errorMessage = `❌ ${user.username} 的登录面板URL格式错误: ${user.login_url}`;
                combinedMessage += combinedMessage ? '\n\n' + errorMessage : errorMessage;
                console.error(errorMessage);
            }
        }
        // console.log(`Combined message to send: ${combinedMessage}`);
        await sendTelegramNotification(combinedMessage);
    } catch (error) {
        console.error('Error in main function:', error);
    } finally {
        process.exit(0);  // Ensure the script exits
    }
};

main().catch(console.error);