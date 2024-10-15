---
title: 来用GitHub Actions替代繁琐的工作流吧
date: 2024-10-15 18:54:00 +0800
categories: [Tech, Web]
tags: [tech]     # TAG names should always be lowercase
---

# 探索GitHub Actions的强大功能

## 前言

在现代软件开发中，自动化是提高效率和减少错误的关键。GitHub Actions 是一个强大的持续集成和持续交付（CI/CD）平台，允许开发者在GitHub上自动化各种任务。本文将介绍GitHub Actions的基本功能，并展示如何使用workflows进行自动化作业。

## 什么是GitHub Actions？

GitHub Actions 是一个内置于GitHub的CI/CD平台，允许你在代码库中定义自动化工作流。通过编写简单的YAML文件，你可以在特定事件（如代码推送、拉取请求、定时任务等）发生时自动执行任务。

### GitHub Actions的主要功能

- **持续集成（CI）**：自动化构建和测试代码，确保每次提交都不会破坏现有功能。
- **持续交付（CD）**：自动化部署过程，将代码部署到生产环境或其他目标环境。
- **自动化任务**：执行各种自动化任务，如代码格式化、依赖更新、通知发送等。
- **定时任务**：通过cron表达式设置定时任务，定期执行特定操作。

## 使用GitHub Actions进行自动化作业

### 创建一个简单的工作流

以下是一个简单的GitHub Actions工作流示例，它将在每次代码推送到主分支时运行，并执行一些基本的任务。

1. 在你的GitHub仓库中，创建一个名为 `.github/workflows` 的目录。
2. 在该目录中创建一个名为 `main.yml` 的文件，并添加以下内容：

    ```yaml
    name: CI

    on:
      push:
        branches:
          - main

    jobs:
      build:
        runs-on: ubuntu-latest

        steps:
        - name: Checkout repository
          uses: actions/checkout@v2

        - name: Set up Node.js
          uses: actions/setup-node@v2
          with:
            node-version: '14'

        - name: Install dependencies
          run: npm install

        - name: Run tests
          run: npm test
    ```

### 解释工作流文件

- `name`: 工作流的名称。
- `on`: 定义触发工作流的事件。在这个例子中，工作流将在代码推送到主分支时触发。
- `jobs`: 定义工作流中的一个或多个任务。
  - `build`: 任务的名称。
  - `runs-on`: 指定运行任务的环境。在这个例子中，任务将在最新的Ubuntu环境中运行。
  - `steps`: 定义任务中的步骤。
    - `name`: 步骤的名称。
    - `uses`: 使用预定义的GitHub Actions。
    - `run`: 运行特定的命令。

### 使用定时任务

你还可以使用cron表达式设置定时任务。例如，以下工作流将在每天的UTC时间0点运行：

```yaml
name: Daily Task

on:
  schedule:
    - cron: '0 0 * * *'

jobs:
  daily-task:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v2

    - name: Run a script
      run: echo "This is a daily task running at UTC 0:00"
```

### 使用Secrets管理敏感信息

GitHub Actions允许你使用Secrets来管理敏感信息，如API密钥、密码等。你可以在GitHub仓库的Settings -> Secrets and variables -> Actions中添加Secrets，然后在工作流中使用它们。

```yaml
name: Use Secrets

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v2

    - name: Use secret
      run: echo "My secret is ${{ secrets.MY_SECRET }}"
```

### 引流

相信聪明的你通过学习上述内容,一定知道了GitHub Actions的强大功能,因此我们可以借助他的强大功能来帮助我们完成日常中的一些琐事,比如各大论坛的签到功能亦或是代码的自动编译

我这边就做了一个简单的[例子](https://github.com/Moeary/MUA_CheckIN),是MUA皮肤站的签到,可以通过看这个来学习GitHub Actions和简单的爬虫知识,然后再动手做到其他的自动化脚本


