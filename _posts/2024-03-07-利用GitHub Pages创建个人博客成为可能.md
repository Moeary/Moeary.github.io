---
title: 利用GitHub Pages创建个人博客成为可能
date: 2024-03-07 18:54:00 +0800
categories: [Tech, Web]
tags: [tech]     # TAG names should always be lowercase
---
## Hello,World!
### 前言
本Blog来自于GitHub 项目:
[chirpy](https://github.com/cotes2020/jekyll-theme-chirpy)

官方给了教程 但是全是英文的 英语苦手难以理解
[教程](https://chirpy.cotes.page/posts/getting-started/)

然后国人也有此前类似的教程
[链接](https://www.cnblogs.com/tungsten106/p/17868774.html)

但我是Windows环境,和Windows系统有些不太一样,所以写下本文用于记录我是如何利用GitHub Pages搭建这个chirpy Theme的

### 教程
本文建立于Jekyll和GitHub Action上

#### 1.第一步建立环境
首先你得先有一个GitHub账号 

然后点击这个[使用模板搭建网站](https://github.com/cotes2020/chirpy-starter/generate)

再将其命名为你的```用户名+github.io```

然后把这个仓库拉到你的本地
```git clone 你的仓库名``` 以便进行后续的环境搭建本地操作

具体教程可以看这里
[如何搭建pages](https://pages.github.com/)

然后进入你刚才建立的repo中进行设置(Setting->Pages->Build and deployment)
在Source来源中选入那个GitHub Actions

![我是图片](https://github.com/Moeary/pic_bed/blob/main/img/20240308102959.png)

至此GitHub Pages那边的环境搞好了

然后配置本地开发环境 因为为前端那一套然后再加上了jekyll养蛊所以比较麻烦
需要的组件要用到nodejs,ruby,bundle,gem等

nodejs推荐使用nvm进行管理 [我是教程](https://www.runoob.com/w3cnote/nvm-manager-node-versions.html)

ruby可以使用ruby-install下载 [我是下载链接](https://rubyinstaller.org/) [我是教程](https://www.runoob.com/ruby/ruby-installation-windows.html)`如果没有gcc编译环境在安装时记得勾选MingW完整安装`

gem一般跟随着ruby自动安装的,然后bundle 安装是`gem install bundle`

这里贴一下我的环境
```
npm     版本 10.1.0
nodejs  版本 20.9.0
ruby    版本 ruby 3.2.3 (2024-01-18 revision 52bb2ac0a6) [x64-mingw-ucrt]
gem     版本 3.4.19
bundle  版本 2.5.6
gcc/g++ 版本 13.2.0
```

然后前往本地刚才git clone下来的仓库
先进行`bash tools/init`
这样是为了
```
1.检出到最新的标签的代码（以确保你的网站的稳定性：因为默认分支的代码正在开发中）。
2.删除非必要的示例文件，并处理与 GitHub 相关的文件。
3.构建 JavaScript 文件并导出到 assets/js/dist/，然后让 Git 跟踪它们。(一般不会自动成功,有这个文件建议去看下面常见问题的问题1)
4.自动创建一个新的提交来保存上述的更改
```

然后运行`bundle` 用于自动下载本模板的依赖包文件

最后执行`bundle exec jekyll s`用于启动这个程序

过几秒后本地服务器就会开启[http://127.0.0.1:4000](http://127.0.0.1:4000).

然后运行完了没问题后 
在运行一下`bundle lock --add-platform x86_64-linux` 因为GitHub pages拿的是Linux机器跑的 然后尝试git push到你的GitHub仓库里面等待自动部署 最后一个漂亮的网页就出来了
### 常见问题
#### 1.缺少home.min.js等文件
[解决方案来源](https://github.com/cotes2020/jekyll-theme-chirpy/issues/1090)
```
- _site/404.html
  *  internal script /assets/js/dist/page.min.js does not exist (line 1)
- _site/about/index.html
  *  internal script /assets/js/dist/page.min.js does not exist (line 1)
- _site/archives/index.html
  *  internal script /assets/js/dist/misc.min.js does not exist (line 1)
- _site/categories/git/index.html
  *  internal script /assets/js/dist/misc.min.js does not exist (line 1)
- _site/categories/index.html
                  .
                  .
                  .
                  .
HTML-Proofer found 10 failures!
Error: Process completed with exit code 1.
```
在执行完命令` run npm install `
后执行要以下脚本
```
#Linux下使用
NODE_ENV=production npx rollup -c --bundleConfigAsCjs 
#Windows下使用
$env:NODE_ENV="production"; npx rollup -c --bundleConfigAsCjs
```
然后在.gitignore文件中第20行 21行
```
20 # Misc
21 assets/js/dist
```
把这两行删掉或者尝试把第21行给注释掉给变成这样
```
20 # Misc
21 # assets/js/dist
```
然后git push到你的GitHub repo上等待自动部署即可

#### 2.缺少其他js文件
因为这个模板仓库里面里面导入了一个其他的库作为子模块[我是那个子模块](https://github.com/cotes2020/chirpy-static-assets/tree/7bc0d86b6af83d7acfc63db50f29a5975cec2513)

只使用git clone没办法把那个子库下载下来,所以可以使用
```
$ git submodule init
$ git submodule update
```
命令来将子库下载下来 然后提交即可

#### 3.其他问题?
邮件给我 cuvo@foxmail.com
