---
title: 潮涌核心社开了 Terraria 服，Minecraft 启动器也更新了
date: 2026-11-19 12:00:00 +0800
categories: [社团, 服务公告]
tags: [潮涌核心社, terraria, minecraft]
description: Terraria 社区服的加入方式、潮涌核心社启动器的版本选择，以及近期维护的校园服务入口。
---

潮涌核心社新开了一个 Terraria（泰拉瑞亚）社区服。想和社友一起开荒、盖房或打 Boss，现在可以直接用原版客户端加入。Minecraft 启动器最近也更新了，这里把进服方式、下载入口和其他社团服务一并记下来。

## Terraria 社区服怎么进

1. 打开 Steam 版 Terraria，推荐使用 PC 原版 `1.4.5.8`。在主菜单选「多人游戏 → 通过 IP 加入」，然后选角色。
2. 地址填 `tr.shoumc.com`，端口填 `7777`。已取消共用进服密码。
3. 首次进入后，在游戏聊天栏用 `/register 你的密码` 建立服务器账户，再用 `/login 你的密码` 登录。已有账户可直接登录，账户密码请单独设置。

这是一个中型经典难度世界。想找队友可以用 `/tpa 玩家名` 发起传送请求，接收方用 `/atp` 同意。`/back` 可以返回上次死亡的地点，`/house` 可以查看圈地指令，`/notewall` 可以查看留言。请留意其他玩家的建筑和箱子，先问过再动手。

## Minecraft 启动器更新

潮涌核心社启动器 SHOU Launcher 的正式版是 [v1.5.0](https://github.com/Conduit-Club/SHOU-Launcher/releases/tag/v1.5.0)，发布页提供 Windows x64 包。想体验新版的社友可下载 [v1.6.2 预发布版](https://github.com/Conduit-Club/SHOU-Launcher/releases/tag/v1.6.2)，按设备选 Windows x64、Windows ARM64 或 Apple 芯片 Mac 的对应下载包。

新版支持拖入整合包安装，以及检查模组、资源包和光影是否有更新。从旧启动器导入实例时，会校验并复用已有的游戏资源，只补下载缺失或损坏的文件。v1.6.2 还会在 Java 启动后继续显示等待进度，直到游戏窗口真正出现。整合包加载较慢时，可以先返回启动器处理其他事。

更新前先退出旧启动器。Windows 解压后把新的 EXE 放回原目录，Apple 芯片 Mac 用解压后的应用替换旧版。遇到实例迁移、账号或启动问题，可以从启动器的「反馈」页提交。

## 其他社团服务

- Minecraft SMP 十月开放了 CloudStorage 云仓，并恢复了 ImageFrame 地图画。进服后用 `/cs` 可以打开云仓，个人材料存入前记得先切到个人仓。[SMP 更新说明](https://github.com/Conduit-Club/Conduit-Club.github.io/blob/main/docs/updates/2026-10-26.md)
- [水专手册（SHOU 指北）](https://manual.shoumc.com/)持续维护校园办事和生活指南，十月更新了学工系统入口和学校 VPN 迁移到 aTrust 的说明。[更新记录](https://github.com/Conduit-Club/SHOU-Online-Manual/pull/83)
- [今日海大吃什么](https://eat.shoumc.com/)可用来查校内外吃饭去处。十月的更新修复了一处授权跳转时的登录状态问题。[更新记录](https://github.com/Conduit-Club/SHOU-What-To-Eat/pull/53)
- [海大来选课](https://lxk.shoumc.com/)可查课程评价和学分信息。十月的更新补上了完整评价显示和小数学分支持。[更新记录](https://github.com/Conduit-Club/SHOU-LXK/commit/9f7a5338985f2d69202eb87786086d6b46475c2d)

进 Terraria 连不上时，可以在群里说一下客户端版本和报错内容，方便一起查。其他社团项目和更新记录可以从[潮涌核心社 GitHub](https://github.com/orgs/Conduit-Club/repositories)找到。
