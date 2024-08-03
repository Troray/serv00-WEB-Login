# Serv00-CT8-Web-Login
 使用Node.Js模拟网页端自动定时登录Serv00、CT8的web面板，实现账号保活。



#### 一、Fork本仓库，然后按以下步骤设置。

#### 设置变量
点仓库 `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

---


| 变量名称       | 值                                                           | 备注                 |
| -------------- | ------------------------------------------------------------ | -------------------- |
| `TG_CHAT_ID`   | 值为你的账号ID。可从 [@userinfobot](https://t.me/userinfobot) 获取。 | 可选，不填则无tg通知 |
| `TG_BOT_TOKEN` | 值为BOT TOKEN，可从 [@BotFather](https://t.me/BotFather) 创建。 | 可选，不填则无tg通知 |
| `LOGIN_INFO`   | 参考下面👇的json 。                                           | 必填                 |

```json
[
  {"username": "登录名", "password": "密码", "login_url": "https://panel3.serv00.com"},
  {"username": "登录名", "password": "密码", "login_url": "https://panel5.serv00.com"},
  {"username": "登录名", "password": "密码", "login_url": "https://panel.ct8.pl"},
  {"username": "登录名", "password": "密码", "login_url": "https://panel.ct8.pl"}
]
```



![](https://raw.githubusercontent.com/Troray/serv00-WEB-Login/main/Snipaste_2024-08-03_09-34-21.png)