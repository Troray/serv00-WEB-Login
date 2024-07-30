# serv00-WEB-Login
 serv00,CT8自动定时登录web。

### 设置变量
点仓库 `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

---
1、添加变量，名称为：  `TG_CHAT_ID` ，值为ID。可从 [@userinfobot](https://t.me/userinfobot) 获取。

---
2、添加变量，名称为：`TG_BOT_TOKEN` ，值为BOT TOKEN，如果没有可从 [@BotFather](https://t.me/BotFather) 创建。

---
3、添加变量，名称为： `LOGIN_INFO` 

内容参考以下：
```
[
  {"username": "登录名", "password": "密码", "login_url": "https://panel3.serv00.com"},
  {"username": "登录名", "password": "密码", "login_url": "https://panel5.serv00.com"},
  {"username": "登录名", "password": "密码", "login_url": "https://panel.ct8.pl"},
  {"username": "登录名", "password": "密码", "login_url": "https://panel.ct8.pl"}
]
```