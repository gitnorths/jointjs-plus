# dome

## 开发环境

| 软件            | 版本      | 备注                                                                                                        |
|---------------|---------|-----------------------------------------------------------------------------------------------------------|
| nodejs        | 20.15.1 | python=python2.7<br> msvs_version=2017<br> registry=https://registry.npm.taobao.org/<br> strict-ssl=false |
| python        | 2.7     | 原生组件编译依赖                                                                                                  |
| visual studio | 2017    | 原生组件编译依赖                                                                                                  |

## 项目初始化

```
npm install
```

> 推荐修改 npmInstall.bat 文件中的代理地址后再运行该脚本，国内网络环境经常出现electron无法下载的情况

### 开发模式

```
npm run electron:serve
```
> 如果使用的是Jetbrains的IED（Intellij、Webstorm），可以在界面起来后执行 electron:debug 的调试配置，用于debug代码

### 打包编译

```
npm run electron:build
```

### 单元测试

```
npm run test:unit
```


### 其它配置

1. [Configuration Reference](https://cli.vuejs.org/config/). 
2. [Vue CLI Plugin Electron Builder](https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/).
