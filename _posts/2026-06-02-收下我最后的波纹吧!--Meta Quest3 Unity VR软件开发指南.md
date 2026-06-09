---
title: "收下我最后的波纹吧!--Meta Quest3 Unity VR软件不完全开发指南"
date: 2026-06-02 20:00:00 +0800
categories: [Unity, VR]
tags: [unity, VR, Meta Quest3, 开发指南]
---

## 前言

该跑路了，跑路之前给学校做了不少好东西，也希望能够把相关的开发经验传承下去。因此写了这一篇文章，篇幅可能有点长，需要耐心阅读。

这篇不是那种“从零开始做一个 VR 小方块”的通用教程，而是给接手同学看的交接文档。你们之前已经拿到了工程文件，本文会围绕这个工程讲：

1. 怎么把工程在自己电脑上打开。
2. 怎么确认 Quest 3 能被 Unity 识别。
3. 怎么看懂工程里已有的场景、移动、菜单、传送、游泳和透视功能。
4. 后续要加场景、改菜单、重新打 APK 时应该检查什么。

目前国内做 Quest 3 + Unity 的教程不算多，而且很多教程还停留在旧版 `Oculus Integration`。本文以我这个工程为主，同时把 2026 年仍然可用的官方资料和社区教程放在后面，方便你们继续查。

> 【截图建议】这里放一张 Quest 3 或项目运行画面。最好用 Meta Quest Developer Hub 的 Cast / Capture 截一张工程主页或中控室画面，不要拍到人脸、宿舍门牌、账号信息。

---

## 一、先说结论：接手这个工程该装什么

本工程路径我这里是：

```text
D:\Unity\OceanMuseum
```

项目当前使用的关键版本如下：

| 项目 | 当前工程版本 |
|---|---|
| Unity Editor | `2022.3.4f1` |
| Meta XR SDK | `com.meta.xr.sdk.all 69.0.0` |
| XR Management | `com.unity.xr.management 4.5.0` |
| Oculus XR Plugin | `com.unity.xr.oculus 4.0.0` |
| Android 最低 API | 29 |
| Android Target API | 32 |
| 包名 | `com.Moear.Grab` |
| 产品名 | `OceanMuseum` |

这里要强调一下：**维护这个工程时优先使用 Unity 2022.3.4f1，不要一上来就用 Unity 6 或更新版本强行打开。**

原因很简单：Unity 工程升级经常是不可逆的，尤其 XR SDK、输入、渲染、Android 构建工具、Prefab 引用都可能被改。你如果只是要继续维护、补场景、改 UI、重新打包，就先按原版本来。

如果以后要新开一个 Quest 3 项目，可以参考官方新路线：Unity 6.1+、Unity OpenXR Plugin、Meta XR Core SDK / All-in-One SDK。新路线我放在最后的资料区，不要和当前工程维护路线混在一起。

> 【截图建议】截 `ProjectSettings/ProjectVersion.txt` 或 Unity Hub 中该工程绑定的 Unity 版本，标出 `2022.3.4f1`。

---

## 二、电脑环境搭建

### 1. 安装 Unity Hub

先安装 Unity Hub。Unity Hub 的作用是管理 Unity 版本、安装模块和打开工程。

### 2. 安装 Unity 2022.3.4f1

在 Unity Hub 里安装 `2022.3.4f1`。如果 Hub 里不好找，就去 Unity Archive 下载对应版本。

安装时必须勾选：

- Android Build Support
- Android SDK & NDK Tools
- OpenJDK

如果没勾，后面会出现这些问题：

- `Build Settings` 里切不到 Android。
- Unity 找不到 JDK / SDK / NDK。
- `Build And Run` 灰掉或报 Gradle 错。

> 【截图建议】截 Unity Hub 的 `Add modules` 页面，把 `Android Build Support`、`Android SDK & NDK Tools`、`OpenJDK` 三项框出来。

### 3. 安装 Visual Studio

建议装 Visual Studio 2022，并在安装器里勾选“使用 Unity 的游戏开发”。这不是运行项目必须的，但改 C# 脚本、看报错、跳转定义会舒服很多。

### 4. 不要手动乱配 JDK / NDK

Unity 这类 Android 构建最怕手动混装一堆 JDK / SDK / NDK。能用 Unity Hub 自带的就用自带的。只有在 Unity 明确提示某个 Android SDK Platform 缺失时，再按提示安装。

---

## 三、打开 OceanMuseum 工程

拿到工程文件后，建议这样做：

1. 把工程放到一个没有中文空格坑的路径，例如 `D:\Unity\OceanMuseum`。
2. 打开 Unity Hub。
3. 点击 `Add` 或 `Open`，选择 `OceanMuseum` 文件夹。
4. 让它使用 Unity `2022.3.4f1` 打开。
5. 第一次打开会导入很久，耐心等。
6. 如果弹出 Package Manager 相关恢复提示，选择按项目配置恢复。

工程里关键目录大概是：

```text
Assets/Scenes                 场景文件
Assets/Plugins                自己写的功能脚本
Assets/Docs                   工程内说明文档
Assets/images                 展板、说明图、UI 图片
Assets/Models                 场景模型和第三方模型资源
Packages/manifest.json        Unity 包依赖
ProjectSettings               项目设置
```

如果打开后 Console 里大量脚本变红，优先检查：

1. Unity 版本是不是错了。
2. `Packages/manifest.json` 是否还在。
3. Meta XR SDK 有没有被正确恢复。
4. Android Build Support 有没有装。

> 【截图建议】截 Unity Project 面板，展示 `Assets/Scenes`、`Assets/Plugins`、`Packages/manifest.json` 这几个关键位置。学弟第一次看 Unity 工程时很容易不知道该看哪里。

---

## 四、Quest 3 真机准备

想让 Unity 把 APK 直接打到 Quest 3，头显必须先变成开发设备。

### 1. 开发者账号和团队

先在 Meta Horizon Developer Dashboard 创建或加入一个 developer team。账号需要完成验证，否则手机 App 里可能看不到 Developer Mode。

### 2. 手机 App 开启开发者模式

在 Meta Horizon App 中找到对应 Quest 3 设备，进入设备设置，打开 Developer Mode。

### 3. Windows 安装 Oculus ADB Driver

Windows 上建议安装 Oculus ADB Driver。装完后用 USB-C 数据线连接 Quest 3。

### 4. 头显里允许 USB Debugging

戴上头显，看到 USB Debugging 弹窗时选择允许，最好勾 `Always allow from this computer`。

### 5. 用 adb 检查

在命令行里执行：

```powershell
adb devices
```

正常应该看到类似：

```text
List of devices attached
XXXXXXXXXXXX    device
```

如果显示 `unauthorized`，说明头显还没授权。重新插拔 USB，再戴上头显确认弹窗。

> 【截图建议】截 `adb devices` 的正常输出，再截一次 Quest 3 头显里的 USB Debugging 弹窗。弹窗可以用 MQDH 投屏截，不要拍到个人信息。

---

## 五、工程里有哪些场景

当前工程加入 Build Settings 的场景是：

| 顺序 | 场景路径 | 作用 |
|---:|---|---|
| 0 | `Assets/Scenes/中控室.unity` | 主入口、菜单和传送中心 |
| 1 | `Assets/Scenes/SHOU.unity` | 上海海洋大学相关场景 |
| 2 | `Assets/Scenes/鲸鱼馆.unity` | 鲸鱼主题展馆 |
| 3 | `Assets/Scenes/展览厅内侧.unity` | 展览厅内侧 |
| 4 | `Assets/Scenes/展览厅.unity` | 展览厅 |
| 5 | `Assets/Scenes/中国航海博物馆--场外.unity` | 场外展示 |
| 6 | `Assets/Scenes/水下漫游.unity` | 水下漫游 |
| 7 | `Assets/Scenes/深海探索.unity` | 深海探索和游泳玩法 |

注意：场景名必须和脚本、按钮里填写的 `sceneName` 对上。中文场景名不是不能用，但填错一个字就跳不过去。

> 【截图建议】截 `File > Build Settings` 的 Scenes In Build 列表，让学弟知道场景必须加到这里，不加就不能被 `SceneManager.LoadScene` 加载。

---

## 六、这个工程的三种移动方式

VR 移动不是随便做的。人在 VR 里很容易晕，所以移动方式要分场景、分人群。

### 1. 默认方式：Meta SDK 传送

大部分场景应该优先使用传送移动。玩家用控制器指向地面，确认后瞬移到落点。

优点：

- 最不容易晕。
- 初学者最容易理解。
- 适合展馆、博物馆、教学演示。

实现上主要依赖 Meta XR SDK 的 Rig 和交互组件。你们后续维护时，不建议轻易删掉场景里的 Camera Rig、OVRManager、Interaction 相关对象。

> 【截图建议】截一张场景 Hierarchy 里的 Camera Rig / OVRCameraRig / Interaction 相关对象，再截一张头显里传送射线指向地面的画面。

### 2. 展览厅：摇杆连续移动

`Assets/Plugins/PlayerController.cs` 是一个自定义摇杆移动脚本。

它做了两件事：

1. 左摇杆控制前后左右移动。
2. 右摇杆控制水平旋转。

核心逻辑是基于相机方向算移动方向：

```csharp
Vector3 forward = cameraTransform.forward;
Vector3 right = cameraTransform.right;
forward.y = 0;
right.y = 0;
```

这样玩家看向哪里，左摇杆往前就会朝视线方向前进。

但是连续移动更容易晕。这个模式适合作为“炫技模式”或给熟悉 VR 的人体验，不建议作为新手默认移动方式。

> 【截图建议】截 `PlayerController` 挂在哪个对象上，以及 Inspector 里的 `moveSpeed`、`turnSpeed`、`cameraTransform`。

### 3. 深海探索：游泳移动

`Assets/Plugins/PlayerSwimController.cs` 是深海探索里的重点脚本。

它支持两种输入：

- 手柄扳机划水：按住左右手柄扳机，通过手部挥动速度产生反向推进。
- 手部追踪划水：脱下手柄后，用裸手划动，通过手部位置变化计算速度。

进入水体后，`WaterVolume.cs` 会调用：

```csharp
playerSwim.EnterWater();
```

离开水体时调用：

```csharp
playerSwim.ExitWater();
```

`PlayerSwimController` 进入水中后会关闭重力，把玩家切到更适合游泳的状态；同时还支持惯性、阻力和右摇杆旋转。

对接手同学来说，最该看懂的是这些字段：

| 字段 | 作用 |
|---|---|
| `trackingSpace` | 指向 VR Rig 的 TrackingSpace，用于把手部局部速度转成世界方向 |
| `swimSpeedMultiplier` | 划水整体速度倍率 |
| `maxSwimSpeed` | 最大移动速度，避免一下飞出去 |
| `handVelocityThreshold` | 手部速度阈值，防止轻微抖动也触发移动 |
| `enableInertia` | 是否启用惯性 |
| `waterDragFactor` | 水中阻力 |
| `handMovementMultiplier` | 手柄划水倍率 |
| `handTrackingMultiplier` | 裸手追踪划水倍率 |

如果你们觉得游泳太快或太慢，优先调 `swimSpeedMultiplier` 和 `maxSwimSpeed`。不要一上来改核心算法。

> 【截图建议】截 `深海探索` 场景中挂着 `PlayerSwimController` 的对象 Inspector，再截 `WaterVolume` 触发区域。最好再截一张头显里深海划水的画面。

---

## 七、菜单、按钮和场景跳转

### 1. 左手柄菜单键

`Assets/Plugins/MenuController.cs` 控制菜单显示和隐藏。

当前默认按键是：

```csharp
public OVRInput.Button menuToggleButton = OVRInput.Button.Start;
```

也就是左手柄菜单键。按下后菜单会出现在相机前方，距离和高度由这两个字段控制：

```csharp
public float menuDistance = 1.0f;
public float verticalOffset = -0.1f;
```

如果菜单离脸太近、太远、太低，就调这两个值。

> 【截图建议】截菜单在头显中的显示效果，再截 `MenuController` 的 Inspector，标出 `menuCanvas`、`menuDistance`、`verticalOffset`、`menuToggleButton`。

### 2. 普通 UI 按钮跳转

`Assets/Plugins/SceneSwitcher.cs` 里的类名是 `SimpleSceneSwitcher`。它通常挂在 Unity UI Button 上。

它支持两种模式：

| `switchMode` | 功能 |
|---:|---|
| 0 | 切换某个 GameObject 显示 |
| 1 | 加载指定场景 |

要做一个“点按钮跳场景”，通常这样配：

1. 给 Button 挂 `SimpleSceneSwitcher`。
2. `switchMode` 填 `1`。
3. `sceneName` 填目标场景名。
4. 勾选 `useFade`，让跳转有黑场过渡。
5. 目标场景必须在 Build Settings 里。

`disableButtonForCurrentScene` 很有用。开启后，如果按钮目标就是当前场景，按钮会自动变灰并不可点击。

> 【截图建议】截一个菜单按钮的 Inspector，标出 `SimpleSceneSwitcher`、`sceneName`、`switchMode`、`disableButtonForCurrentScene`、`useFade`。

### 3. 跨场景出生点

有些时候从 A 门进入 B 场景，不希望玩家出现在默认出生点，而是希望出现在 B 场景对应的门口。

工程里已经支持这个功能：

- `SimpleSceneSwitcher.useTargetSpawnPoint`
- `SimpleSceneSwitcher.targetSpawnPointId`
- `SceneSpawnPoint.spawnPointId`

做法：

1. 在目标场景门口放一个空物体。
2. 挂 `SceneSpawnPoint`。
3. 给它填唯一 ID，例如 `Door_DeepSea_Entry`。
4. 在源场景按钮或传送门的 `SimpleSceneSwitcher` 中勾选 `useTargetSpawnPoint`。
5. `targetSpawnPointId` 填同一个 ID。

加载场景后，脚本会找到对应 `SceneSpawnPoint`，把玩家 Rig 移过去。

> 【截图建议】一张截目标场景里的 `SceneSpawnPoint`，一张截源场景按钮里的 `targetSpawnPointId`。两个 ID 要同屏或用红框标出来。

### 4. 3D 物体或 Poke 跳转

`Assets/Plugins/VRInstantSceneSwitcher.cs` 适合挂在 3D 物体、Poke 按钮、射线点击对象上。

它提供一个公开方法：

```csharp
public void LoadSceneNow()
```

把这个方法绑定到 Button OnClick、Poke OnSelect 或其他 UnityEvent 里，就能触发跳转。

如果给它指定 `existingSwitcher`，它会复用 `SimpleSceneSwitcher` 的淡入淡出效果；如果不指定，就直接 `SceneManager.LoadScene(sceneName)`。

---

## 八、UI 展板和提示图

这个工程不是只有 VR 移动，里面还有很多展板和说明图。后续维护时，大概率会改这些。

### 1. 图片轮播

`Assets/Plugins/PictureRoll.cs` 用来做时间线/详情图轮播。

它里面有两个数据结构：

```csharp
public class DetailImage
public class TimelineEvent
```

`TimelineEvent` 里有日期、标题、描述、主图、详情图、事实列表。`PictureRoll` 会把这些数据更新到 TMP 文本和 Image 上。

另外它监听了 Meta 控制器按键：

- `OVRInput.Button.One`：上一张
- `OVRInput.Button.Two`：下一张

如果你们后面发现 A/B/X/Y 和其他功能冲突，就来这里改。

### 2. 提示图轮播

`Assets/Plugins/HintImageCarousel.cs` 更像是给用户看的操作提示图轮播。

它使用 `Texture2D` 和 `RawImage`，支持：

- 上一页 / 下一页
- 循环播放
- 页码显示
- 9:16 竖图比例
- 每张图单独设置偏移和缩放

如果要把操作说明做成几张竖版图片，就把图片拖进 `hintPages`。

> 【截图建议】截提示面板和 `HintImageCarousel` 的 Inspector，标出 `hintPages`、`targetImage`、`previousButton`、`nextButton`、`pageText`。

### 3. 菜单面板切换

`PanelSwitchController.cs` 用来在两个面板之间切换，比如“传送菜单”和“帮助提示”。

`PanelActivationButton.cs` 则是更简单的“点一个按钮，打开一个面板，关闭另一个面板”。

维护建议：

- UI 不要做太密。
- VR 里字一定要大。
- 菜单最好放在用户正前方 1 米左右。
- 中文字体要确认 TextMeshPro 字体资产支持，否则容易方块字。

---

## 九、透视 Passthrough

Quest 3 的彩色透视是很有用的功能。当前工程里有 `Assets/Plugins/PassthroughController.cs`。

它挂载对象需要有 `OVRManager`，脚本开头也写了：

```csharp
[RequireComponent(typeof(OVRManager))]
```

它支持：

- 启动时是否自动开启透视：`enablePassthroughOnStart`
- 用某个按键切换透视：`toggleButton`
- 透视开启时显示某些物体：`objectsToShowInPassthrough`
- 透视开启时隐藏某些物体：`objectsToHideInPassthrough`
- 透视时隐藏天空盒：`hideSkyboxInPassthrough`

当前默认切换按钮是：

```csharp
public OVRInput.Button toggleButton = OVRInput.Button.Two;
```

也就是 B 或 Y 一类按键，具体左右手柄取决于绑定和输入状态。

如果透视开了但画面不对，检查：

1. OVRManager 是否还在。
2. Quest 3 真机是否支持并授权。
3. Camera clear flags 和背景 alpha 是否被其他脚本改掉。
4. 想在透视中隐藏的模型有没有加入 `objectsToHideInPassthrough`。

> 【截图建议】截 `PassthroughController` Inspector，再截一次开启透视后的运行画面。真实环境画面要避开隐私。

---

## 十、光照、模型和性能

Quest 3 虽然比 Quest 2 强不少，但它仍然是一体机，不是台式机显卡。VR 对性能很敏感，掉帧会让人晕。

### 1. 帧率目标

至少稳定 72 FPS。更高可以追 90 FPS，但不要为了画面把性能吃爆。

大概记住：

| 目标帧率 | 每帧预算 |
|---:|---:|
| 72 FPS | 13.9 ms |
| 90 FPS | 11.1 ms |
| 120 FPS | 8.3 ms |

### 2. 模型资源

本工程有不少海洋、展馆、船只、鱼群模型。后续加模型时注意：

- 不要导入过高面数的模型。
- 尽量压缩贴图。
- 能合并材质就合并材质。
- 透明材质、玻璃、水面、粒子不要滥用。
- 动态鱼群数量要控制。

### 3. 光照

静态展馆优先使用烘焙光照。实时灯光越多，Quest 压力越大。

推荐做法：

1. 静态模型勾 Static。
2. 主光源和环境光调好。
3. 烘焙 Lightmap。
4. 真机看亮度、阴影和帧率。

> 【截图建议】截 Lighting 设置、Lightmap 烘焙结果，以及一个场景中 Static 勾选示例。

### 4. 实机测试

不要只在 Unity Editor 里看。Editor 流畅不代表 Quest 3 流畅。

至少每次大改后做一次：

1. Build And Run 到 Quest 3。
2. 走一遍中控室菜单。
3. 跳每个场景。
4. 试传送。
5. 试深海游泳。
6. 看是否有黑屏、卡顿、按钮点不到、出生点错误。

---

## 十一、编译与打包 APK

### 1. 检查 Build Settings

打开：

```text
File -> Build Settings
```

确认：

- Platform 是 Android。
- 所有要跳转的场景都在 Scenes In Build。
- Quest 3 出现在 Run Device。

### 2. 检查 Player Settings

打开：

```text
Edit -> Project Settings -> Player -> Android
```

重点看：

- Company Name：`Moear`
- Product Name：`OceanMuseum`
- Package Name：`com.Moear.Grab`
- Scripting Backend：IL2CPP
- Target Architectures：ARM64
- Min API：29
- Target API：32

如果 ARM64 选不了，先把 Scripting Backend 改成 IL2CPP。

> 【截图建议】截 Player Settings 的 Android Other Settings，标出 Package Name、IL2CPP、ARM64、Min API、Target API。

### 3. Build And Run

连接 Quest 3 后点击：

```text
Build And Run
```

Unity 会生成 APK，并尝试安装到头显。

本工程根目录里可以看到之前打过的：

```text
OceanMuseum.apk
```

如果只是给别人安装，可以直接用 adb：

```powershell
adb install -r OceanMuseum.apk
```

如果提示签名、包名或版本问题，先卸载旧版本再装：

```powershell
adb uninstall com.Moear.Grab
adb install OceanMuseum.apk
```

---

## 十二、以后加一个新场景怎么做

假设你们要加第 9 个场景，建议按这个流程：

1. 在 `Assets/Scenes` 下新建场景。
2. 放入必要模型、灯光、地面、交互对象。
3. 确保场景里有 VR Rig 或从已有场景复制一套可靠配置。
4. 如果需要从菜单跳转，给菜单按钮配置 `SimpleSceneSwitcher`。
5. `sceneName` 必须填场景真实名称。
6. 如果需要门对门传送，配置 `SceneSpawnPoint`。
7. 把新场景加入 Build Settings。
8. 真机 Build And Run 测试。

每新增一个场景，至少检查这 8 项：

| 检查项 | 是否完成 |
|---|---|
| 场景已加入 Build Settings |  |
| 菜单卡片文案和封面图已更新 |  |
| `SimpleSceneSwitcher.sceneName` 正确 |  |
| 当前场景按钮会自动变灰 |  |
| 目标场景有合理出生点 |  |
| 特殊玩法脚本引用没有丢 |  |
| Quest 3 真机能进入 |  |
| 退出、返回中控室、再进入都正常 |  |

---

## 十三、常见问题

### 1. Unity 打开工程后一堆红色报错

优先看 Unity 版本。这个工程优先用 `2022.3.4f1`。版本不对最容易引发包依赖和 API 报错。

### 2. Build And Run 找不到 Quest 3

按顺序查：

1. 头显是否开启 Developer Mode。
2. USB 线是不是数据线。
3. 头显里是否允许 USB Debugging。
4. Windows 是否装 Oculus ADB Driver。
5. `adb devices` 是否能看到 `device`。

### 3. 跳转场景失败

优先看：

1. 目标场景是否加入 Build Settings。
2. `sceneName` 是否和场景名完全一致。
3. 中文场景名有没有多空格、少字、错字。

### 4. 进入场景后出生点不对

检查：

1. 目标场景有没有 `SceneSpawnPoint`。
2. `spawnPointId` 和 `targetSpawnPointId` 是否完全一致。
3. 是否勾选 `useTargetSpawnPoint`。

### 5. 深海游泳不动

检查：

1. 玩家对象上有没有 `PlayerSwimController`。
2. 同对象或父级有没有 Rigidbody。
3. 水体触发器有没有 `WaterVolume`。
4. 触发器 Collider 是否勾选 Is Trigger。
5. `trackingSpace` 是否引用正确。
6. 如果用手柄，是否按住扳机划水。
7. 如果用裸手，Quest 是否切到 Hand Tracking。

### 6. 菜单看不见

检查：

1. `MenuController.menuCanvas` 是否引用菜单 Canvas。
2. Canvas 初始是否被隐藏但可被脚本重新显示。
3. `menuDistance` 是否太小或太大。
4. Camera.main 是否存在。
5. 是否按的是左手柄菜单键。

---

## 十四、如果你们要从零新建 Quest 3 项目

如果不是维护本工程，而是以后要开新坑，建议参考 2026 年官方推荐路线：

1. Unity 6.1+。
2. 创建 Universal 3D / URP 项目。
3. 安装 Android Build Support、OpenJDK、Android SDK & NDK Tools。
4. 用 Unity OpenXR Plugin。
5. 安装 Meta XR Core SDK + Interaction SDK，或者 Meta XR All-in-One SDK。
6. 启用 Meta XR Feature Group。
7. 用 Meta XR Tools 的 Project Setup Tool 修配置。
8. 用 Building Blocks 添加 Camera Rig、Controller Tracking、Hand Tracking、Grab、Poke、Ray、Teleport、Passthrough。
9. 最后一定 Build And Run 到 Quest 3 真机。

官方资料：

- Meta Unity setup: <https://developers.meta.com/horizon/documentation/unity/unity-project-setup/>
- Meta Hello World: <https://developers.meta.com/horizon/documentation/unity/unity-tutorial-hello-vr/>
- Building Blocks: <https://developers.meta.com/horizon/documentation/unity/bb-overview/>
- Interaction SDK: <https://developers.meta.com/horizon/documentation/unity/unity-isdk-getting-started/>
- Unity Meta Quest workflow: <https://docs.unity.cn/Manual/xr-meta-quest-develop.html>

我另外整理了一份资料库在仓库的 `docs/unity` 下面，包含官方文档、社区教程、FAQ 和截图建议。

---

## 十五、最后给接手同学的话

这个项目最重要的不是某一段脚本，而是“能稳定跑在 Quest 3 上”。所以后续维护时请记住：

1. 不要随便升级 Unity 和 SDK。
2. 不要删看不懂的 XR Rig、OVRManager、Interaction 对象。
3. 每改一个场景，都要进 Quest 3 真机走一遍。
4. 菜单、场景名、Build Settings 三者必须一致。
5. 新手体验优先传送移动，连续移动和游泳玩法放在熟悉后再试。

愿你们少踩坑，多做点真正能跑起来的东西。技术会过时，但把工程交接清楚这件事永远不会过时。

