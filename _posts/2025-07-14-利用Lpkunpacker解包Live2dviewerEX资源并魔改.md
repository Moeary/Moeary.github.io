---
title: 利用LpkUnpacker解包Live2dviewerEX资源并魔改
date: 2025-7-14 10:54:00 +0800
categories: [Python, Tech]
tags: [tech] # TAG names should always be lowercase
mermaid: true
---

## 前言

最近在折腾 Live2DViewerEX 的模型，发现有些模型的贴图不是我喜欢的类型

![](https://s2.loli.net/2025/10/11/m265RdaFPfueTqY.png)

于是就萌生了自己动手魔改的想法。经过一番摸索，终于成功实现了资源的替换。这篇文章就记录一下具体的流程，希望能帮助到有同样需求的朋友。

整个流程的核心思路是：**提取 -> 替换 -> 导入**。我们主要会用到两款工具：`AssetStudio` 用于提取游戏或别的大佬魔改好的贴图资源，`LpkUnpacker` 用于解包和打包 Live2DViewerEX 的 `.lpk` 模型文件。

在这里可以下载到实验整合包([mega盘](https://mega.nz/folder/Y9R3SZiL#OP7pA3N4U4yw3gfQyDGu0Q))

## 准备工作

0. 如果你从上面的mega盘下载了工具文件 步骤1和2就不用做了
1.  [**AssetStudio**](https://github.com/aelurum/AssetStudio): 一款强大的 Unity 资源提取工具。可以从 `https://github.com/aelurum/AssetStudio/releases/tag/v0.18.0` 页面下载最新版本。
2.  [**LpkUnpacker**](https://github.com/Moeary/LpkUnpackerGUI): 专门用于解包 Live2DViewerEX LPK 文件的工具。同样，从其 GitHub 的 `https://github.com/Moeary/LpkUnpackerGUI/releases/tag/Gold` 页面下载 `LpkUnpackerGUI.exe` 即可。
3.  [**Live2DViewerEX**](https://store.steampowered.com/app/616720/Live2DViewerEX/): 当然，你得[购买](https://store.steampowered.com/app/616720/Live2DViewerEX/)并安装了这个应用,也不贵,推荐购买本体加spine扩展。
4.  **你想要魔改的资源**: 比如别的大佬的live2d角色文件(一般为无后缀的unity文件,此教程以"chaijun_5逆兔女郎"为例)。

## 操作流程

### 第一步：使用 AssetStudio 提取魔改资源的贴图

首先，我们需要从我们想要“借用”的游戏或应用中，把角色的贴图文件提取出来。这里以上面mega盘给到的教程文件为例。

1.  双击打开 `AssetStudioGUI.exe`。
2.  点击 `File` -> `Load file` 或 `Load folder`，选择包含目标资源的游戏文件或文件夹。
![](https://s2.loli.net/2025/10/11/pZ1hfmEaF5jG8vq.png)

![](https://s2.loli.net/2025/10/11/kyoUMGFT5s8erm4.png)
3.  在 `Asset List` 列表中，找到类型为 `Texture2D` 的资源(一般点击两次size,材质文件一般是最大的)，这些就是贴图文件。
![](https://s2.loli.net/2025/10/11/YUerjQvMfqR5X4C.png)
4.  通过预览找到你需要的角色贴图，选中它们。
5.  右键点击，选择 `Export selected assets`，将贴图导出到一个你找得到的地方。
![](https://s2.loli.net/2025/10/11/GYPWwFg2hvfUrqo.png)

这样，我们就获得了用于替换的“素材”。
![](https://s2.loli.net/2025/10/11/SpwjqMT8bFdmCKe.png)

### 第二步：使用 LpkUnpackerGUI 提取 Live2D 模型文件

接下来，我们要解包 Live2DViewerEX 中你想要修改的模型。这些模型通常是以 `.lpk` 文件的形式存在于 Steam 创意工坊的下载目录中。

1.  找到 `.lpk` 文件。它通常位于 Steam 目录下，例如：
    -   `path/to/your/steam/steamapps/workshop/content/616720/...`
    -   `path/to/your/steam/steamapps/common/Live2DViewerEX/shared/workshop/...`
2.  在 `.lpk` 文件旁边，通常会有一个 `config.json` 文件，这个文件对于解密至关重要。
3.  打开 `LpkUnpackerGUI.exe`。
![](https://s2.loli.net/2025/10/11/OXWjHyRDSEavnbL.png)
4.  将 `.lpk` 文件和 `config.json` 文件拖入程序窗口，或者手动选择路径。
![](https://s2.loli.net/2025/10/11/pvJQPSC3l6fqkgx.png)
5.  选择一个输出目录（Output Directory）但是一般不用选择 都是默认输出到output文件夹下面的。
6.  点击 `Extract` 按钮，等待程序解包完成,然后打开输出文件夹。
![](https://s2.loli.net/2025/10/11/cdqyVgoj9b31nDl.png)

解包后，你会在输出目录中得到一个文件夹，里面包含了模型的 `model0.json` 文件、贴图文件（通常是 `.png` 格式）以及动作配置文件等等。

![](https://s2.loli.net/2025/10/11/Y5fvwAr4tyFHCeM.png)

### 第三步：替换贴图并导入

现在，万事俱备，只欠东风。

1.  打开刚刚解包出来的模型文件夹。
2.  你会看到类似 `textures_0_0.png`, `textures_0_1.png` 这样的原始贴图文件。
![](https://s2.loli.net/2025/10/11/brKMDPRvcIC9SEo.png)
3.  将你在第一步中用 AssetStudio 提取出来的贴图文件复制到这个文件夹中。
![](https://s2.loli.net/2025/10/11/ybJanLvNMsm5gHt.png)
4.  **关键一步**：删除原始的贴图文件，然后将你复制进来的新贴图文件重命名，使其与原始贴图的文件名完全一致（例如，`textures_0_0.png`）。
![](https://s2.loli.net/2025/10/11/BfpykUOdGToumEr.png)
### 第四步：在 Live2DViewerEX 中更新模型

最后一步，我们需要让 Live2DViewerEX 重新加载我们修改过的模型。

1.  启动 Live2DViewerEX，进入“工作室模式”。
![](https://s2.loli.net/2025/10/11/XU6TC3gqpPwV2ut.png)
2.  在工作室模式中，点击Live2D/Spine编辑器 然后json配置文件 把model0.json丢进去 
![](https://s2.loli.net/2025/10/11/mJoP3MrGkycLlUu.png)
![](https://s2.loli.net/2025/10/11/E2hQKW1ZvIBDAoy.png)
![](https://s2.loli.net/2025/10/11/5p3CWc4OuFkoxGN.png)
3.  此时工作室会自动加载l2d模型,这样就能实现贴图魔改和l2d预览了!
![](https://s2.loli.net/2025/10/11/OD5yQAx1wlog4JN.png)
对比之前的正常贴图版本
![](https://s2.loli.net/2025/10/11/nWGIkemwdtg3Dor.png)
4. (选做) 上传魔改完贴图的l2d文件,参考[官方教程](https://live2d.pavostudio.com/doc/zh-cn/exstudio/workshop-uploader/)

后续还有更高级的模型换装功能(支持多种魔改贴图部署在一个l2d文件夹里面,通过菜单按钮可以调整魔改的材质贴图 实现多种lsp的需求!) 待整理 预计在下面一篇推文里面实现!!!

![](https://s2.loli.net/2025/10/11/NLgYp3skOnqVJhU.png)
