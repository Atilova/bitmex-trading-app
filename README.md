# bitmex-trading-app

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### Set your API_KEY and API_SECRET
Create .env file in root directort and set following
```
VUE_APP_BITMEX_API_KEY="YOUR_KEY"
VUE_APP_BITMEX_API_SECRET="YOUR_KEY"
```

### Краткая техническая сторона 
При загрузке странице, первым делом осуществляется подключение по web socket’у, если не удается, то высвечивает страница ошибки, и socket продолжает попытки подключения (в случае пропажи сети, выхода компьютера из режима сна или прерванного соединение, это страница [NetworkErrorView] будет также отрисована) На этом этапе socket ждет и пытается установить соединение. После все же успешного подключения, будет отрисовано 4 компонента [DashboardView], каждый из которых может быть перезагружен в ручном режиме при помощи кнопки перезагрузить в верхнем правом углу каждого компонента [ReloadButton]
