---
title: "从零开始搭建 Meta Quest3 Unity VR 工程：直到 Building Blocks 传送能跑起来"
date: 2026-06-02 21:00:00 +0800
categories: [Unity, VR]
tags: [unity, VR, Meta Quest3, Meta XR SDK, Building Blocks]
---

## 前言

维护旧工程和从零新建工程的做法不太一样：接手之前的 `OceanMuseum` 旧项目得顺着它原来的老版本走，而从零开一个 Quest 3 Unity VR 新工程，直接按现在的新工具链搭会省事很多。这篇主要记录从空白工程一路配到真机里能用手柄传送移动的完整步骤：

1. 新建 Unity VR 工程并装齐 Android 模块。
2. 配好 OpenXR 与 Meta XR SDK。
3. 用 Building Blocks 加上 Camera Rig 和传送组件。
4. 排查“地面看得见但传送射线落不上去”的常见原因。
5. 打包安装到 Quest 3 真机测试。

## 一、版本选择

如果只是继续维护之前的 `OceanMuseum` 旧工程，直接用它原本对应的 Unity `2022.3.4f1` 就行，别乱升版本。

如果是从头建新工程，建议按官方目前推荐的组合配：

- Unity 6.1+（至少也用 Unity 2022.3.15f1 以上的 LTS 版本）。
- Unity OpenXR Plugin。
- Meta XR Core SDK + Meta XR Interaction SDK，或者直接装整合包 Meta XR All-in-One SDK。
- Quest 3 / Quest 3S 真机。

学校机房或者课程如果有统一的 Unity 2022 环境要求，用 Unity 2022 LTS 也完全没问题，下面遇到菜单位置不一样的地方我会顺带标一下两个版本的入口。

## 二、安装 Unity 和 Android 模块

在 Unity Hub 里安装编辑器时，下面三个模块必须勾上，少一个后面打 APK 都会报错：

- `Android Build Support`
- `Android SDK & NDK Tools`
- `OpenJDK`

如果之前装 Unity 的时候忘了勾，打开 Unity Hub 进到 `Installs`，点对应版本右边的齿轮或三个点，选 `Add modules` 把这三项补装上就行。

## 三、创建 Unity 工程

打开 Unity Hub 点 `New project`，模板选 `Universal 3D`（旧版叫 `3D URP`），项目名比如填 `Quest3TeleportDemo`，目录尽量放在简短的纯英文路径下：

```text
D:\Unity\Quest3TeleportDemo
```

别把 Unity 工程建在 OneDrive 同步目录、太深的中文路径或者权限受限的系统盘目录里，Unity 零碎文件极多，路径不对很容易出各种莫名其妙的编译报错。第一次进工程导入包会比较慢，等右下角进度条走完、Console 里没有成片红字报错再往下走。

## 四、切换到 Quest / Android 构建平台

- **Unity 6.1+**：打开 `File > Build Profiles`，选中 `Meta Quest`，点 `Enable Platform` 或 `Switch Platform`；弹窗提示安装 OpenXR 相关依赖包时点允许。
- **Unity 2022 / 2023**：打开 `File > Build Settings`，选中 `Android`，点 `Switch Platform`。

第一次切到 Android 平台会重导资源，耗时比较长，中途别强行关编辑器。

## 五、安装 XR Plug-in Management 和 OpenXR

打开 `Edit > Project Settings > XR Plug-in Management`，如果还没装插件就先点 `Install XR Plugin Management`。

装好之后在对应平台下勾上 `OpenXR`（Unity 6 在 Meta Quest / Android 标签页，Unity 2022 在 Android 标签页），接着点进左侧的 OpenXR 子菜单确认这几项：

- 启用了 Meta Quest / Meta XR 相关的 Feature Group。
- Interaction Profiles 里已经加上了 `Oculus Touch Controller Profile`。
- Meta XR Feature、Foveation、Subsampled Layout 等特性按需勾选。

不同版本的 Meta XR SDK 里个别开关名字会有出入，只要确保 Android 构建目标启用了 OpenXR（或旧版 Oculus XR provider），并且配上了手柄的 Controller Profile 就可以。

## 六、安装 Meta XR SDK

### 方式一：走 Asset Store / Package Manager（推荐新手）

1. 去 Unity Asset Store 网页搜 `Meta XR All-in-One SDK`，点添加到自己的 `My Assets`。
2. 回到 Unity 打开 `Window > Package Manager`，左上角筛选切到 `My Assets`。
3. 找到 `Meta XR All-in-One SDK`，依次点 Download / Import / Install。

不想装全家桶的话，单独装 `Meta XR Core SDK` 和 `Meta XR Interaction SDK` 这两个包也够用，刚上手还是直接装 All-in-One 最省事。

### 方式二：走 UPM / NPM Registry

适合已经熟悉 `manifest.json` 包管理的同学。第一次配 VR 工程除非项目组已经统一了包源，不然没必要走这边。

## 七、用 Project Setup Tool 自动修配置

导完 Meta XR SDK 之后，顶部菜单栏会多出 `Meta XR Tools`。点开 `Meta XR Tools > Project Setup Tool`，切到 Android 目标页，依次点一下 `Fix All` 和 `Apply All`。

这个检查面板会自动帮你把 Android 构建参数、XR Feature、权限声明、图形渲染 API 和推荐设置扫一遍。看到黄色警告不用慌，照着列表点后面的 `Fix` 基本都能一键修好。

## 八、搭一个最小测试场景

刚开始别急着往里塞大展馆模型，先拿最简单的几何体把视角和移动调通：只需要一个玩家 Camera Rig、一块能踩的地面、一套传送组件和几个辨认方向用的方块。

1. **保存场景**：点 `File > Save As`，存成 `Assets/Scenes/MainScene.unity`（没有 `Scenes` 目录就顺手建一个）。
2. **删掉默认相机**：把场景自带的 `Main Camera` 删掉，后面会换用 Meta XR 的 Camera Rig，留着两个相机会抢视角。
3. **放一块地面和参照物**：在 Hierarchy 里右键选 `3D Object > Plane`，改名叫 `Ground_Teleport`，`Position` 设 `0, 0, 0`，`Scale` 设 `10, 1, 10`。Unity 自带的 Plane 默认就挂着 `Mesh Collider`，射线可以直接打中。然后再右键建几个 `3D Object > Cube` 摆在地面四周当参照物，注意别堵在原点把玩家出生位置卡住。

## 九、用 Building Blocks 添加 Camera Rig

打开 `Meta XR Tools > Building Blocks`，在面板里找到并添加：

- `Camera Rig`
- `Controller Tracking`

不同 SDK 小版本里卡片名字可能略有区别（比如 `Camera Rig`、`OVRCameraRig` 或 `Interaction Rig`），选基础的 Camera Rig 就行。加完之后，Hierarchy 里会多出一套玩家节点，里面包含 `TrackingSpace`、`CenterEyeAnchor`、`LeftHandAnchor`、`RightHandAnchor` 和 `OVRManager` 等组件，头显正是靠这套节点定位玩家视角与双手位置。

## 十、用 Building Blocks 添加传送功能

接着还在 `Building Blocks` 窗口里搜 `Teleport`、`Teleportation` 或 `Locomotion`（有的版本把传送归在 Locomotion 分类底下），点添加进当前场景。

加进去之后，场景里会生成 `Teleport Locomotion`、`Teleport Interactor`、`Teleport Interactable`、`Locomotion Controller` 或 `Teleport Arc / Reticle` 这类对象。刚上手不用挨个抠它们的内部脚本，只要理清配合关系就行：手柄发出的射线负责选落点，地面上的 Collider 和 Teleport Interactable 组件负责告诉射线“这块地方允许落脚”。

## 十一、为什么地面看得见却不能传送

很多同学第一次跑起来都会卡在这儿：头显里明明看得见地板，手柄指过去却不出落点。能看见只代表有渲染网格，能传送通常得同时满足五个条件：

1. 有可见的 Mesh（方便人眼确认位置）。
2. 挂了物理碰撞体（Collider）。
3. 物体的 Layer 包含在传送射线的检测 Mask 里。
4. 挂了 SDK 对应的 `Teleport Area` / `Teleport Interactable` 组件（或已被 Building Blocks 自动绑定）。
5. 表面法线朝上且坡度在允许范围内，不能是竖墙或者天花板。

### 1. 检查 Collider

地面没挂 Collider 的话，射线会直接穿过去。自带的 Plane 默认有 `Mesh Collider`，但你自己从外部导进来的展馆地板、楼梯、甲板模型往往是不带碰撞体的。

给自定义地面补碰撞体一般有三种搞法：简单平地直接挂 `Box Collider`，高低起伏地形挂 `Mesh Collider`，或者干脆把“看的模型”和“踩的碰撞面”拆开。实际做展馆项目我最推荐拆开做：保留复杂的视觉地面不动，另外在上面贴几个关掉 `Mesh Renderer` 的透明 `Plane` 或 `Box` 专门接传送射线，既省性能又不容易出现奇怪的射线卡缝问题。

### 2. 对齐 Layer 与 Mask

传送射线一般都带 Layer Mask 过滤，只认特定层上的碰撞体。稳妥起见可以专门建一层：

1. 选中 `Ground_Teleport`，点 Inspector 右上角的 `Layer > Add Layer`，新建一层叫 `TeleportGround`。
2. 回到 `Ground_Teleport` 把它的 Layer 改成 `TeleportGround`。
3. 找到场景里传送射线相关的组件，在它的 Layer Mask / Surface Mask 里把 `TeleportGround` 勾上。

如果 Building Blocks 添加传送块时已经自动配好了默认层，顺着它生成的配置用就行，只要保证地面所在 Layer 在射线的检测勾选范围内即可。

### 3. 补齐 Teleport Area / Interactable 组件

光有 Collider 有时候还不够，部分 SDK 版本要求可落脚的地面必须显式挂上交互组件。如果 Building Blocks 没自动帮你挂到新地面上，可以先点开它自带的示例地面看一眼挂了什么脚本（常见名字有 `Teleport Area`、`Teleport Interactable`、`Teleportation Area` 或 `Locomotion Teleport Surface`），然后选中你的 `Ground_Teleport`，点 `Add Component` 搜 `Teleport` 把同名组件挂上去，检查一遍里面的引用和 Layer Mask。

## 十二、分清碰撞体、光照烘焙和导航网格

刚学 Unity 很容易把别人嘴里说的几种“烘焙”跟地面碰撞混为一谈，这三样东西干的是完全不同的活：

### 1. Collider（物理碰撞）不用烘焙

传送射线能不能打中地面，第一关看的就是物理组件 Collider：

| Collider | 适合对象 |
|---|---|
| Box Collider | 方形平台、墙、简单台阶 |
| Mesh Collider | 不规则地面、模型表面 |
| Capsule Collider | 玩家身体、柱状触发范围 |
| Sphere Collider | 球形触发范围 |

别图省事给几万面的复杂展馆全挂 `Mesh Collider`，真机跑起来开销大，射线落点还容易乱跳。老老实实单建一层隐藏 `Mesh Renderer`、设成 `TeleportGround` 层的简化碰撞面最稳当。

### 2. Static / Lightmap 烘焙只管光照

把物体右上角勾上 `Static` 再去烘焙 Lightmap，是为了把光影提前算进贴图里省运行时性能，既不会帮你生出 Collider，也不会让传送系统认出这块地面。

### 3. NavMesh 烘焙主要给寻路用

`Window > AI > Navigation` 里的 NavMesh Bake 默认是给 NPC 寻路用的。Meta Building Blocks 里的基础射线瞬移一般不强制依赖 NavMesh，除非你选用的移动方案明确要求绑定导航网格，或者你想借着导航网格严格卡死玩家可去的可行走边界，否则刚开始排错先查 Collider、Layer 和 Teleport 组件就行。

## 十三、真机或串流测试传送

场景里配齐 Camera Rig、Controller Tracking、Teleport 组件和带碰撞的 `Ground_Teleport` 之后，进 Play Mode 或者打包上 Quest 3 按下面顺序试一遍：

1. 戴好头显拿起手柄，确认虚拟手或手柄模型正常跟着动。
2. 用手柄指向地面，看有没有射出传送弧线和地面圆圈落点。
3. 推摇杆或按下触发键再松开，看视角有没有瞬移到落点位置。

遇到异常按现象排查很快：

- **连传送弧线都没有**：查 Controller Tracking 块和 Teleport / Locomotion 块加没加全、手柄连没连上、Console 有没有报 XR 初始化错误。
- **有弧线但地面不出落点**：查地面 Collider、Layer Mask 勾选、Teleport Area / Interactable 组件，以及地面是不是放反了法线或坡度太陡。
- **能传送过去但身高或落点偏得离谱**：查 Camera Rig 原点坐标、地面父节点有没有非均匀缩放、传送组件里的高度偏移，别把 Rig 初始位置埋进地板底下。

## 十四、加几面墙和不可传送区

测试没问题之后，可以右键 `3D Object > Cube` 建几面墙（比如起名 `Wall_01`，`Scale` 设 `10, 2, 0.2`）围在地面边缘，保留自带的 `Box Collider` 模拟真实展馆。

这里注意把墙体的 Layer 留在 `Default` 之类的普通层，千万别放进 `TeleportGround`，传送射线的 Mask 里也别把墙所在的层勾进去，不然一指墙整个人就瞬移上墙了。同理，展馆里不想让玩家踩进去的展台或水池区域，换个普通 Layer 或者摘掉 Teleport 组件就能挡住。

## 十五、基础灯光与烘焙建议

测试阶段留着场景默认的 `Directional Light` 当主光源就够了，地面给个浅色材质，四面墙换点不同颜色方便转头辨认方向，顺手把太吃性能的实时软阴影关掉减轻头显负担。

等后面换成正式展馆模型时，再把不动的建筑勾选 `Static`，进 Lighting 面板配好环境光烘一套 Lightmap，上真机核对亮度和帧率。

## 十六、配置 Android Player Settings

打开 `Edit > Project Settings > Player`，切到 Android 标签页重点核对这几项：

- `Company Name` 与 `Product Name`：按项目命名填好。
- `Package Name`：改成规范的包名格式，比如 `com.school.quest3demo`。
- `Scripting Backend`：必须切成 `IL2CPP`。
- `Target Architectures`：勾上 `ARM64`（如果这一项是灰的，先去把上面那个 Scripting Backend 改成 IL2CPP 就亮了）。
- `Minimum API Level` / `Target API Level`：按当前安装的 Meta XR SDK 要求选（Project Setup Tool 也会提示）。

## 十七、开启 Quest 3 开发者模式并连通 ADB

头显如果是第一次拿来跑开发包，先走一遍连接准备：

1. 注册并加入一个 Meta 开发者组织（Developer Organization）。
2. 手机打开 Meta Horizon App 连上头显，在设备设置里打开 `Developer Mode`。
3. 电脑上装好 Oculus ADB Driver。
4. 拿 USB-C 数据线把 Quest 3 插到电脑上，戴上头显在弹窗里点允许 USB 调试。
5. 在电脑终端里敲一行命令确认连上了：

```powershell
adb devices
```

列表里状态显示为 `device`（不是 `unauthorized` 也不是空的），才算真正认到了头显。

## 十八、Build And Run 到真机

打开 `File > Build Profiles`（旧版是 `File > Build Settings`），最后核对四件事：

1. `MainScene` 已经勾进了上面的 `Scenes In Build` 列表。
2. 当前激活平台确实是 `Meta Quest` / `Android`。
3. `Run Device` 下拉框里选到了你的 Quest 3。
4. 点击 `Build And Run` 选择输出路径开始打包。

首次编译 IL2CPP 会比较久，打完包后 Unity 会自动把 APK 推到头显里拉起运行。如果平时只想把打好的现成 APK 装进另一台头显，直接走命令行覆盖安装就行：

```powershell
adb install -r Quest3TeleportDemo.apk
```

## 十九、常见故障速查表

| 问题 | 优先检查 |
|---|---|
| 没有 VR 视角 | Camera Rig / OVRManager / XR Plug-in Management |
| 控制器不显示 | Controller Tracking Block、OpenXR Controller Profile、头显是否识别控制器 |
| 没有传送射线 | Teleport / Locomotion Block 是否添加 |
| 有射线但不能落点 | Ground 是否有 Collider、Layer Mask 是否包含 Ground |
| 能落点但传不过去 | Teleport Interactable / Area 配置、Locomotion Controller 引用 |
| 只能传到墙上 | 墙的 Layer 被加入了 Teleport Mask |
| 地面模型好看但不能传 | 模型没有 Collider，或 Collider 太复杂/Layer 不对 |
| Build 后黑屏 | XR 配置、OpenXR Feature、场景是否加入 Build、Console/Logcat 报错 |
| Quest 不在 Run Device | Developer Mode、USB Debugging、ADB Driver、数据线 |

## 二十、验收清单

往下接正式展馆业务之前，先把下面这 9 条逐项打勾确认跑通：

1. Unity 正常打开工程无红字编译报错。
2. 构建平台已切到 Android / Meta Quest。
3. Meta XR SDK 安装完成。
4. Project Setup Tool 里没有未处理的致命报错。
5. 场景里放好了 Camera Rig。
6. 真机里双手控制器追踪正常。
7. 地面能正常触发传送射线落点。
8. Quest 3 真机可以一键 `Build And Run`。
9. 玩家能在测试地面上正常瞬移走动。

把这几步基础交互跑稳了，再往场景里导大建筑、叠 UI 菜单和写自定义逻辑，排查起问题来会清楚得多。

## 参考资料

- Meta Unity setup: <https://developers.meta.com/horizon/documentation/unity/unity-project-setup/>
- Meta Hello World: <https://developers.meta.com/horizon/documentation/unity/unity-tutorial-hello-vr/>
- Building Blocks: <https://developers.meta.com/horizon/documentation/unity/bb-overview/>
- Meta XR UPM Packages: <https://developers.meta.com/horizon/documentation/unity/unity-package-manager/>
- Interaction SDK: <https://developers.meta.com/horizon/documentation/unity/unity-isdk-getting-started/>
- Unity Meta Quest workflow: <https://docs.unity.cn/Manual/xr-meta-quest-develop.html>
