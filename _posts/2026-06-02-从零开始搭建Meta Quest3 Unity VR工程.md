---
title: "从零开始搭建 Meta Quest3 Unity VR 工程：直到 Building Blocks 传送能跑起来"
date: 2026-06-02 21:00:00 +0800
categories: [Unity, VR]
tags: [unity, VR, Meta Quest3, Meta XR SDK, Building Blocks]
---

## 前言

上一篇写的是怎么接手我已经发给你们的 `OceanMuseum` 工程。这一篇单独讲“如果你要从零新建一个 Quest 3 Unity VR 工程，应该怎么一路搭到能在头显里传送移动”。

为什么要单独写？因为接手旧工程和从零开新工程不是一回事。旧工程要尊重原版本和原配置，新工程则应该按现在更推荐的方式来。本文目标很明确：

1. 创建一个新的 Unity VR 工程。
2. 装好 Android 和 Meta XR SDK。
3. 配好 XR。
4. 用 Building Blocks 加 Camera Rig 和传送功能。
5. 搞清楚为什么“看得见的地面”不一定“能传送”。
6. Build And Run 到 Quest 3 真机。

> 【截图建议】这里放一张最终效果图：头显里能看到传送射线指向地面，地面上有可落点提示。

---

## 一、版本选择：先不要乱装

如果你只是维护我发的 `OceanMuseum` 工程，请回去看上一篇，用 Unity `2022.3.4f1`。

如果你是新建工程，建议用官方当前推荐路线：

- Unity 6.1+，最低也尽量用 Unity 2022.3.15f1 以上的 LTS。
- Unity OpenXR Plugin。
- Meta XR Core SDK + Meta XR Interaction SDK，或者直接 Meta XR All-in-One SDK。
- Quest 3 / Quest 3S 真机。

如果学校机房环境或者已有课程统一要求 Unity 2022，也可以用 Unity 2022 LTS。本文步骤里会同时提示 Unity 6 和旧版 Unity 的入口差异。

> 【截图建议】截 Unity Hub 里安装的 Unity 版本，以及模块列表。

---

## 二、安装 Unity 和 Android 模块

打开 Unity Hub，安装 Unity Editor 时一定勾选：

- Android Build Support
- Android SDK & NDK Tools
- OpenJDK

这三个缺一个都可能导致后面打包失败。

如果已经装过 Unity，但忘记勾模块：

1. 打开 Unity Hub。
2. 进入 `Installs`。
3. 找到你的 Unity 版本。
4. 点齿轮或三个点。
5. 选择 `Add modules`。
6. 补选 Android 相关模块。

> 【截图建议】截 `Add modules` 页面，把 `Android Build Support`、`Android SDK & NDK Tools`、`OpenJDK` 三项框出来。

---

## 三、创建 Unity 工程

### 1. 新建项目

打开 Unity Hub：

1. 点击 `New project`。
2. 模板选 `Universal 3D` 或 `3D URP`。
3. 项目名可以叫 `Quest3TeleportDemo`。
4. 路径建议放在纯英文路径，例如：

```text
D:\Unity\Quest3TeleportDemo
```

不要把工程放在 OneDrive、中文很长的路径、带奇怪权限的系统目录里。Unity 工程文件很多，路径问题会制造很多无聊错误。

### 2. 等待项目导入完成

第一次打开会比较慢。等右下角导入进度结束，Console 没有大面积红色报错再继续。

> 【截图建议】截 Unity Hub 新建项目页面，另截 Unity 打开后的默认空场景。

---

## 四、切换到 Quest / Android 构建平台

### Unity 6.1+ 的做法

1. 打开 `File > Build Profiles`。
2. 选择 `Meta Quest`。
3. 点击 `Enable Platform` 或 `Switch Platform`。
4. 如果提示安装 OpenXR 相关包，允许安装。

### Unity 2022 / 2023 的做法

1. 打开 `File > Build Settings`。
2. 选择 `Android`。
3. 点击 `Switch Platform`。

切平台可能很慢，尤其第一次切到 Android。不要中途强关。

> 【截图建议】截 `Build Profiles` 或 `Build Settings`，标出当前平台已经切到 `Meta Quest` / `Android`。

---

## 五、安装 XR Plug-in Management 和 OpenXR

打开：

```text
Edit > Project Settings > XR Plug-in Management
```

如果还没安装，先点 `Install XR Plugin Management`。

然后在对应平台启用 OpenXR：

- Unity 6：在 Meta Quest / Android 目标页启用 `OpenXR`。
- Unity 2022：在 Android 目标页启用 `OpenXR`。

接着进入 OpenXR 设置，确认：

- 已启用 Meta Quest / Meta XR 相关 Feature Group。
- 已添加 `Oculus Touch Controller Profile`。
- Meta XR Feature、Foveation、Subsampled Layout 等功能按需要启用。

如果你用的是旧版 Meta XR SDK，有些选项名字会不一样。不要死记名字，核心原则是：**Quest 3 Android 构建目标要有 OpenXR 或 Meta/Oculus XR provider，并且控制器 Profile 要可用。**

> 【截图建议】截 `Project Settings > XR Plug-in Management`，再截 OpenXR 的 Android / Meta Quest 设置页。

---

## 六、安装 Meta XR SDK

### 方式一：Asset Store / Package Manager

适合新手。

1. 打开 Unity Asset Store 或网页。
2. 搜 `Meta XR All-in-One SDK`。
3. 加到 My Assets。
4. 回到 Unity，打开 `Window > Package Manager`。
5. 左上角切到 `My Assets`。
6. 找到 `Meta XR All-in-One SDK`。
7. 点击 Download / Import / Install。

如果你不想一次装太多，可以只装：

- Meta XR Core SDK
- Meta XR Interaction SDK

不过初学阶段 All-in-One 更省事。

### 方式二：UPM / NPM Registry

这种方式更适合已经熟悉 Unity 包管理的人。学弟第一次做不建议从这里开始，除非老师或项目组已经统一了包源。

> 【截图建议】截 Package Manager 中 `Meta XR All-in-One SDK` 已安装的状态。

---

## 七、用 Project Setup Tool 修项目配置

导入 Meta XR SDK 后，菜单栏会出现 Meta XR 相关工具。打开：

```text
Meta XR Tools > Project Setup Tool
```

对当前目标平台执行：

1. `Fix All`
2. `Apply All`

这个工具会检查并修复一批常见配置，例如：

- Android 构建设置。
- XR Feature。
- 权限。
- 渲染和图形 API。
- 推荐的 Meta XR 配置。

看到警告不要慌，先读提示。很多提示点一下 Fix 就能解决。

> 【截图建议】截 Project Setup Tool 的检查列表，最好截 Fix 前和 Fix 后各一张。

---

## 八、创建一个最小 VR 场景

先别急着做复杂展馆。最小场景只需要：

- 一个玩家 Camera Rig。
- 一块可站立地面。
- 一个可传送组件。
- 一点简单模型作为方向参照。

### 1. 保存场景

先保存当前场景：

```text
File > Save As
```

命名为：

```text
Assets/Scenes/MainScene.unity
```

如果没有 `Scenes` 文件夹，就自己新建。

### 2. 删除默认 Main Camera

Unity 默认场景里有一个 `Main Camera`。VR 工程里我们会用 Meta XR 的 Camera Rig，所以可以删掉默认 Main Camera，避免场景里有两个相机互相抢。

### 3. 添加地面

右键 Hierarchy：

```text
3D Object > Plane
```

命名为：

```text
Ground_Teleport
```

建议设置：

```text
Position: 0, 0, 0
Scale: 10, 1, 10
```

Unity 的 Plane 默认自带 Mesh Collider，所以它天然可以被射线检测到。

为了方便看方向，可以再加几个 Cube：

```text
3D Object > Cube
```

把 Cube 放在地面四周，不要挡住玩家出生点。

> 【截图建议】截 Hierarchy 中 `Ground_Teleport` 和几个 Cube，再截 Scene 视图里地面效果。

---

## 九、用 Building Blocks 添加 Camera Rig

打开：

```text
Meta XR Tools > Building Blocks
```

先添加：

- Camera Rig
- Controller Tracking

不同 SDK 版本里名称可能略有差异。有的叫 `Camera Rig`，有的出现 `OVRCameraRig` 或 `Interaction Rig`。新手先选 Building Blocks 里最明确的 Camera Rig。

添加完成后，Hierarchy 里应该出现类似这些对象：

- Camera Rig / OVRCameraRig
- TrackingSpace
- CenterEyeAnchor
- LeftHandAnchor
- RightHandAnchor
- OVRManager

如果场景里没有 OVRManager 或 XR Rig，Quest 头显里就不知道该用哪个对象当玩家视角。

> 【截图建议】截 Building Blocks 窗口里 Camera Rig 的卡片，再截添加后的 Hierarchy。

---

## 十、用 Building Blocks 添加传送功能

继续在 Building Blocks 里找：

- Teleport
- Teleportation
- Locomotion

不同版本的 Meta XR SDK 名字不完全一样。有的版本把传送放在 `Locomotion` 里，有的版本直接叫 `Teleport`。找不到时优先看 Building Blocks 中和移动、Locomotion 相关的块。

添加后，场景里通常会出现传送相关对象，例如：

- Teleport Locomotion
- Teleport Interactor
- Teleport Interactable
- Locomotion Controller
- Teleport Arc / Reticle

这些对象不用一开始全看懂。先记住一句：**传送由控制器射线负责选点，由地面上的 Collider / Teleport Interactable 负责告诉系统“这里可以落脚”。**

> 【截图建议】截 Building Blocks 里 Teleport / Locomotion 的卡片，再截添加后的传送相关对象。

---

## 十一、为什么地面看得见却不能传送

这是初学者最常见的问题。VR 里“能看到地面”和“系统认为这里能落脚”是两件事。

一个可传送地面通常至少需要满足：

1. 有可见 Mesh。
2. 有 Collider。
3. 在传送系统允许检测的 Layer / Mask 中。
4. 挂了对应的 Teleport Area / Teleport Interactable，或者被 Building Blocks 自动识别为可传送表面。
5. 法线方向和坡度合理，不是墙面、天花板或奇怪斜面。

### 1. Collider 是必须的

如果地面没有 Collider，传送射线就打不到它。

Unity Plane 默认有 Mesh Collider，所以入门建议先用 Plane 测试。

如果你用的是自己导入的模型，例如展馆地面、楼梯、甲板，它可能没有 Collider。你可以：

- 给简单地面加 Box Collider。
- 给复杂地面加 Mesh Collider。
- 单独做一个不可见的简化碰撞地面。

我更推荐第三种：**视觉模型归视觉模型，碰撞地面归碰撞地面。**

比如展馆地面很复杂，但玩家只需要在平面上走。那就新建几个透明 Box / Plane 作为 Teleport Ground，用来接收传送射线。这样比给整个复杂模型加 Mesh Collider 更稳。

> 【截图建议】截 Ground 的 Inspector，标出 Mesh Renderer 和 Mesh Collider。再截一个复杂模型旁边单独放透明碰撞平面的例子。

### 2. Layer / Mask 要对上

传送系统通常会有一个 Layer Mask，用来决定射线能检测哪些物体。

建议新建一个 Layer：

```text
TeleportGround
```

然后：

1. 选中 `Ground_Teleport`。
2. 在 Inspector 右上角 Layer 里选择 `Add Layer`。
3. 新建 `TeleportGround`。
4. 回到 `Ground_Teleport`，把 Layer 设为 `TeleportGround`。
5. 找到传送相关组件里的 Layer Mask / Surface Mask。
6. 勾选 `TeleportGround`。

有些 Building Blocks 会自动创建或使用默认 Layer。那就按它生成的组件来，不要强行改。核心是：**地面所在 Layer 必须被传送射线的 Mask 包含。**

> 【截图建议】截 Layer 下拉框中新建的 `TeleportGround`，再截传送组件中的 Layer Mask。

### 3. Teleport Area / Teleport Interactable

只加 Collider 有时还不够。不同 SDK / 组件组合会要求地面上有一个明确的 Teleport 组件。

如果 Building Blocks 自动给地面加好了，就不用手动加。

如果没有，你可以检查传送示例对象，看看它用的是哪个组件。常见名字可能是：

- Teleport Area
- Teleport Interactable
- Teleportation Area
- Locomotion Teleport Surface

做法是：

1. 选中 `Ground_Teleport`。
2. `Add Component`。
3. 搜 `Teleport`。
4. 选择 SDK 里对应的地面/区域组件。
5. 确认组件引用和 Layer Mask 正确。

> 【截图建议】截 Ground 上挂的 Teleport 相关组件。注意不同 SDK 版本名字不一样，截图比文字更有用。

---

## 十二、复杂地面、碰撞和“烘焙”到底怎么理解

你可能听到别人说“碰撞烘焙”“地面烘焙”“导航烘焙”。这些词容易混在一起。

### 1. Collider 不是烘焙

Unity 里的 Collider 是物理碰撞组件。Teleport 射线能不能打到地面，首先看 Collider。

常见 Collider：

| Collider | 适合对象 |
|---|---|
| Box Collider | 方形平台、墙、简单台阶 |
| Mesh Collider | 不规则地面、模型表面 |
| Capsule Collider | 玩家身体、柱状触发范围 |
| Sphere Collider | 球形触发范围 |

入门阶段不要给所有复杂模型都加 Mesh Collider。Mesh Collider 精度高，但开销也高，而且复杂模型容易出现射线落点奇怪的问题。

更稳的做法是：

- 视觉模型正常显示。
- 单独建一个简化的碰撞面。
- 碰撞面可以隐藏 Mesh Renderer，只保留 Collider。
- 碰撞面 Layer 设成 `TeleportGround`。

### 2. Static / Lightmap 烘焙是光照，不是传送

把地面勾 Static、烘焙 Lightmap，是为了光照和性能，不是为了让传送能用。

Lightmap 烘焙能让场景更好看、更省性能，但它不会自动生成 Collider，也不会让传送射线识别地面。

### 3. NavMesh 烘焙不是所有传送都需要

`Window > AI > Navigation` 里的 NavMesh Bake，主要给 AI 寻路或 NavMesh 相关移动使用。

Meta Building Blocks 的传送通常不一定依赖 NavMesh。你如果只是做“控制器射线指向地面，然后瞬移过去”，优先检查 Collider、Layer 和 Teleport 组件。

什么时候才考虑 NavMesh？

- 你的传送系统明确要求 NavMesh。
- 你要让 NPC 或鱼群在某个地面上寻路。
- 你想限制玩家只能落在导航网格覆盖的区域。

如果只是入门传送，不要一开始就纠结 NavMesh。

> 【截图建议】这一节可以放三张对比图：Collider Inspector、Lighting 烘焙面板、Navigation Bake 面板，图注写清楚三者不是一回事。

---

## 十三、做一个最小传送测试

现在场景里应该有：

- Camera Rig
- Controller Tracking
- Teleport / Locomotion
- `Ground_Teleport`
- Ground 上的 Collider
- Ground 可被传送系统检测

进入 Play Mode 或 Build 到 Quest 3 后测试：

1. 戴上 Quest 3。
2. 拿起控制器。
3. 指向地面。
4. 看是否出现传送弧线或落点提示。
5. 按住或点击传送触发键。
6. 松开后玩家应移动到目标位置。

如果没有传送弧线：

- 检查 Controller Tracking 是否添加。
- 检查 Teleport / Locomotion Block 是否添加。
- 检查控制器是否被识别。
- 检查 Console 是否有 XR 报错。

如果有弧线但没有落点：

- 检查地面 Collider。
- 检查 Layer / Mask。
- 检查 Teleport Area / Interactable。
- 检查地面是不是太斜或法线方向不对。

如果能落点但传送后位置很奇怪：

- 检查 Camera Rig 的原点。
- 检查地面缩放是否异常。
- 检查传送组件是否把高度或朝向设置错。
- 不要让 Rig 起点埋在地板下。

> 【截图建议】截三张：没有落点的问题图、正确出现落点的图、传送后的站位图。这样学弟能直观看懂。

---

## 十四、添加一个简单墙体和障碍物

为了让传送场景更像真实展馆，可以加几面墙和障碍物。

1. `3D Object > Cube`。
2. 命名 `Wall_01`。
3. 调整 Scale，例如 `10, 2, 0.2`。
4. 放在地面边缘。
5. 保留 Box Collider。

注意：

- 墙不要放到 `TeleportGround` Layer。
- 墙的 Layer 可以是 Default。
- 传送 Mask 不要包含墙，否则射线可能打到墙面。
- 如果你想禁止传送到某些地面区域，可以把那块地面放到其他 Layer，或不挂 Teleport 组件。

> 【截图建议】截地面和墙体不同 Layer 的设置。

---

## 十五、给场景加基础光照

默认 Directional Light 可以先保留。

简单场景建议：

1. Directional Light 作为主光。
2. 地面用浅色材质。
3. 墙体用不同颜色区分方向。
4. 关掉过重的实时阴影，避免 Quest 压力过大。

如果要做正式展馆：

1. 静态模型勾 Static。
2. 打开 Lighting 面板。
3. 设置合适的 Environment Lighting。
4. 烘焙 Lightmap。
5. 真机检查亮度和性能。

> 【截图建议】截 Lighting 面板和一个已勾 Static 的地面或墙体。

---

## 十六、配置 Player Settings

打开：

```text
Edit > Project Settings > Player > Android
```

重点检查：

- Company Name：随便填，但最好统一。
- Product Name：应用名。
- Package Name：例如 `com.school.quest3demo`。
- Scripting Backend：IL2CPP。
- Target Architectures：ARM64。
- Minimum API Level：按 SDK 要求，Quest 项目通常不应太低。
- Target API Level：按 Unity / Meta 当前建议。

如果 ARM64 灰掉，先把 Scripting Backend 改成 IL2CPP。

> 【截图建议】截 Player Settings 的 Android Other Settings，标出 Package Name、IL2CPP、ARM64。

---

## 十七、Quest 3 开发者模式和 ADB

如果你之前没配过 Quest 3：

1. 加入或创建 Meta developer team。
2. 在 Meta Horizon App 里打开 Developer Mode。
3. Windows 安装 Oculus ADB Driver。
4. USB-C 连接 Quest 3。
5. 头显里允许 USB Debugging。
6. 命令行执行：

```powershell
adb devices
```

看到 `device` 才说明电脑能识别头显。

> 【截图建议】截 Meta Horizon App 的 Developer Mode，截 `adb devices` 正常输出。

---

## 十八、Build And Run 到 Quest 3

打开：

```text
File > Build Profiles
```

或旧版：

```text
File > Build Settings
```

确认：

1. 当前场景加入 Scenes In Build。
2. 平台是 Meta Quest / Android。
3. Run Device 选中 Quest 3。
4. 点击 `Build And Run`。

第一次构建可能很慢。构建成功后 Unity 会把 APK 安装到 Quest 3 并启动。

如果你只是想手动安装 APK：

```powershell
adb install -r Quest3TeleportDemo.apk
```

---

## 十九、传送功能排错表

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

---

## 二十、最小完成标准

做到这里，一个合格的 Quest 3 VR 入门工程应该满足：

1. Unity 能正常打开项目。
2. Android / Meta Quest 平台能切换。
3. Meta XR SDK 已安装。
4. Project Setup Tool 没有关键错误。
5. 场景里有 Camera Rig。
6. 控制器能被追踪。
7. 地面可被传送射线识别。
8. Quest 3 真机能 Build And Run。
9. 玩家能用传送在地面上移动。

如果这 9 条都满足，再去做展馆、菜单、交互、游泳、透视。不要反过来，一开始就堆大模型和复杂 UI，最后发现最基础的 Rig 和传送都没跑起来。

---

## 参考资料

官方资料：

- Meta Unity setup: <https://developers.meta.com/horizon/documentation/unity/unity-project-setup/>
- Meta Hello World: <https://developers.meta.com/horizon/documentation/unity/unity-tutorial-hello-vr/>
- Building Blocks: <https://developers.meta.com/horizon/documentation/unity/bb-overview/>
- Meta XR UPM Packages: <https://developers.meta.com/horizon/documentation/unity/unity-package-manager/>
- Interaction SDK: <https://developers.meta.com/horizon/documentation/unity/unity-isdk-getting-started/>
- Unity Meta Quest workflow: <https://docs.unity.cn/Manual/xr-meta-quest-develop.html>

我整理的资料库：

- `docs/unity/quest3-meta-xr-quickstart.md`
- `docs/unity/tutorial-sources.md`
- `docs/unity/troubleshooting-faq.md`
- `docs/unity/image-and-screenshot-guide.md`

最后一句话：VR 工程最重要的是先把最小闭环跑通。先能进头显，先能看到控制器，先能传送，再谈展馆和特效。

