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
            await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
            await page.type('#id_username', user.username);
            await page.type('#id_password', user.password);
            await page.click('#submit');
            await page.waitForNavigation({ waitUntil: 'networkidle2' });

            const title = await page.title();
            const regexStrona = /Strona/i;
            const regexHome = /home/i;

            if (regexStrona.test(title) || regexHome.test(title)) {
                await page.waitForSelector('.table.nostripes.table-condensed');

                let expirationDate;
                try {
                    expirationDate = await page.evaluate(() => {
                        const expirationRow = document.querySelectorAll('.table.nostripes.table-condensed tr')[2];
                        const expirationDateCell = expirationRow.querySelectorAll('td')[1];
                        return expirationDateCell.innerText;
                    });

                    const parseDate = (dateStr) => {
                        const datePatternEng = /(\w+)\. (\d+), (\d+), (\d+):(\d+) (\w+)\./;
                        const datePatternEngAlt = /(\w+) (\d+), (\d+), (\d+):(\d+) (\w+)\./;
                        const datePatternPl = /(\d+) ([a-ząęśćółń]+) (\d+) (\d+):(\d+)/;

                        let date;
                        if (datePatternEng.test(dateStr) || datePatternEngAlt.test(dateStr)) {
                            const pattern = datePatternEng.test(dateStr) ? datePatternEng : datePatternEngAlt;
                            const [, month, day, year, hour, minute, period] = pattern.exec(dateStr);
                            const formattedTime = period === 'a.m.' ? `${hour}:${minute} AM` : `${hour}:${minute} PM`;
                            date = new Date(`${month} ${day}, ${year} ${formattedTime}`);
                        } else if (datePatternPl.test(dateStr)) {
                            const monthsPl = { 'stycznia': 'January', 'lutego': 'February', 'marca': 'March', 'kwietnia': 'April', 'maja': 'May', 'czerwca': 'June', 'lipca': 'July', 'sierpnia': 'August', 'września': 'September', 'października': 'October', 'listopada': 'November', 'grudnia': 'December' };
                            const [, day, month, year, hour, minute] = datePatternPl.exec(dateStr);
                            date = new Date(`${monthsPl[month]} ${day}, ${year} ${hour}:${minute}`);
                        } else {
                            throw new Error(`Unrecognized date format: ${dateStr}`);
                        }

                        return date.toLocaleString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
                    };

                    expirationDate = parseDate(expirationDate);
                } catch (error) {
                    console.error(`Error parsing date for ${user.username}:`, error);
                    expirationDate = '获取日期时出错';
                }

                await browser.close();
                return `✅ 面板登录通知\n用户: ${user.username} 已登录.\n到期日期: ${expirationDate}.\n登录面板: ${user.login_url}\n登录IP: ${ipAddress}\n登录时间: ${beijingTime}`;
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
    return `❌ 面板登录通知\n${user.username} 登录失败.\n登录面板: ${user.login_url}\n登录IP: ${ipAddress}\n登录时间: ${beijingTime}`;
};

const main = async () => {
    try {
        const ipAddress = await getIPAddress();
        let combinedMessage = '';
        for (const user of LOGIN_INFO) {
            if (validateLoginUrl(user.login_url)) {
                const message = await loginAndCheck(user, ipAddress);
                combinedMessage += combinedMessage ? '\n\n' + message : message;
            } else {
                const errorMessage = `❌ 面板登录通知\n${user.username} 的登录面板URL格式错误: ${user.login_url}`;
                combinedMessage += combinedMessage ? '\n\n' + errorMessage : errorMessage;
                console.error(errorMessage);
            }
        }
        await sendTelegramNotification(combinedMessage);
    } catch (error) {
        console.error('Error in main function:', error);
    } finally {
        process.exit(0);  // Ensure the script exits
    }
};

main().catch(console.error);
