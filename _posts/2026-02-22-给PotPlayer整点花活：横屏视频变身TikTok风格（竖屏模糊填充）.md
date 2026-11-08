---
title: "给PotPlayer整点花活：横屏视频变身TikTok风格（竖屏模糊填充）"
date: 2026-02-22 14:00:00 +0800
categories: [折腾, 软件技巧]
tags: [PotPlayer, HLSL, Shader, 视频播放器]
---

## 起因

桌面上放一块竖屏副屏平时看代码、查文档挺舒服，但拿来看 16:9 的番剧或者电影就很难受了，画面只占中间窄窄一条，上下全是黑边。

后来我想着，能不能照着抖音、TikTok 和 YouTube Shorts 那种样式，把上下黑边区域用当前画面的高斯模糊背景填上。虽然中间正片没有变大，但全屏看的时候顺眼很多。

## 为什么直接用 Pixel Shader

最开始我顺手问了一下大模型，它给的方案是装 **K-Lite Codec Pack**，开 **ffdshow** 滤镜再写 **AviSynth** 脚本做实时处理。我试了一圈发现太重了：得额外装一堆平时根本用不上的解码器，而且 AviSynth 走 CPU 实时算模糊，播高码率视频风扇直接起飞。

其实就做这点画面后处理，直接用 PotPlayer 自带的 **像素着色器（Pixel Shader）** 跑在显卡上就够了。

PotPlayer 里提供了两个着色器挂载位置：“调整尺寸前的着色器”（Pre-resize）和“调整尺寸后的着色器”（Post-resize）。

![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051547176.png)

入口在 **右键 -> 视频 -> 像素着色** 菜单底下，两者的执行时机不一样：

- **调整尺寸前（Pre-resize）**：在视频缩放适应窗口之前跑，处理的是原视频分辨率（比如 1080p 就固定算 `1920x1080` 个像素），一般用来做锐化、去色块这类跟源像素挂钩的滤镜。
- **调整尺寸后（Post-resize）**：在画面已经拉伸到播放器窗口尺寸之后跑，直接按当前窗口或全屏分辨率计算。

我们这个模糊背景放在“调整尺寸后”更合适（注意两边别同时勾，不然会被重复算两次）。不过这里有个小坑：默认比例下，PotPlayer 的 Shader 只会渲染有视频画面的那块 `16:9` 区域，上下黑边压根不经过 Shader，直接写模糊是填不出去的。

绕过去的办法也很简单：

1. 先把 PotPlayer 的宽高比强制切成 **全屏（拉伸）**，让变形的视频撑满整个竖屏渲染区。
2. 写一段 `.hlsl` 着色器，渲染时把中间原本属于 `16:9` 的区域按坐标比例压回正常长宽比，上下多出来的区域采样放大后的画面做高斯模糊并稍微压暗。

## 配置步骤

### 第一步：新建着色器脚本

进到 PotPlayer 安装目录下的 `PxShader` 文件夹，新建一个文本文件，命名为 `TikTokStyle.txt`。

![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051549068.png)

（图里我用的文件管理器是 OneCommander，跟系统自带资源管理器操作一样。）

把下面这段 HLSL 代码贴进去保存：

```hlsl
// TikTokStyle.txt
// 作者：Moear
// 功能：竖屏显示器播放横屏视频时，自动用高斯模糊填充上下黑边

// --- 参数设置 (如果比例不对，请修改这里) ---
// 输入视频的宽高比 (16:9 = 1.7777)
#define VIDEO_AR 1.7777 
// 你的显示器宽高比 (1440/2560 = 0.5625)
#define SCREEN_AR 0.5625
// 模糊强度 (值越大越模糊，建议 0.002 - 0.01)
#define BLUR_SIZE 0.002

sampler s0 : register(s0);
float4 p0 : register(c0); // 包含屏幕分辨率信息 (width, height, counter, clock)

// 简单的 13点 高斯模糊
float4 GaussianBlur(float2 texCoord)
{
    float4 color = 0;
    float2 offset[13] = {
        float2(0, 0),
        float2(-1, 0), float2(1, 0), float2(0, -1), float2(0, 1),
        float2(-2, 0), float2(2, 0), float2(0, -2), float2(0, 2),
        float2(-1, -1), float2(1, 1), float2(-1, 1), float2(1, -1)
    };
    
    // 权重
    float weight[13] = { 0.2, 0.08, 0.08, 0.08, 0.08, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04 };
    
    // 简单的根据屏幕比例修正模糊方向
    float2 scale = float2(1.0, SCREEN_AR); 

    for (int i = 0; i < 13; i++)
    {
        color += tex2D(s0, texCoord + offset[i] * BLUR_SIZE * scale) * weight[i];
    }
    return color;
}

float4 main(float2 tex : TEXCOORD0) : COLOR
{
    // 1. 计算缩放因子
    // 我们需要知道把画面“缩”多少才能变回正常的 16:9
    // 这里的逻辑是：(屏幕长宽比 / 视频长宽比)
    float scaleFactor = SCREEN_AR / VIDEO_AR;
    
    // 2. 绘制模糊背景 (使用拉伸的全屏画面进行模糊)
    // 为了增加美感，我们可以把背景稍微放大一点(Zoom)再模糊，防止边缘重复太明显
    float2 bgTex = (tex - 0.5) * 0.8 + 0.5; // 背景放大 1.25倍
    float4 bgColor = GaussianBlur(bgTex);
    // 稍微调暗背景，突出中间主体
    bgColor.rgb *= 0.6; 

    // 3. 绘制中间的主画面
    // 坐标变换：将当前的纹理坐标(0~1)映射回中间的小区域
    float newY = (tex.y - 0.5) / scaleFactor + 0.5;
    
    // 如果计算出的 Y 坐标在 0~1 之间，说明这里应该画原本的视频
    if (newY >= 0.0 && newY <= 1.0)
    {
        // 采样原始视频 (未模糊)
        // 注意：x 坐标不需要变换，因为我们假设是左右撑满，上下留黑边
        return tex2D(s0, float2(tex.x, newY));
    }
    else
    {
        // 否则，绘制模糊的背景
        return bgColor;
    }
}
```

### 第二步：把画面比例改成全屏拉伸

这一步漏掉的话脚本是不会出效果的：

1. 打开 PotPlayer 播放一个横屏视频。
2. 点击 **右键 -> 画面 -> 宽高比 -> 全屏 (拉伸)**（也可以按 `Ctrl + Enter` 或 `Ctrl + F6` 切到这个模式）。

刚切过去画面会被纵向拉得很长，像下面这样，属于正常现象：

![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051551087.png)

### 第三步：启用着色器

1. 点击 **右键 -> 视频 -> 像素着色 -> 调整尺寸后的着色切换** 打开总开关（快捷键是 `Ctrl + Alt + P`）。
2. 再进 **右键 -> 视频 -> 像素着色 -> 调整尺寸后着色集**，把刚才建好的 `TikTokStyle` 勾上。

![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051552248.png)

勾上之后中间画面就会恢复正常的 `16:9` 比例，上下两条黑边也自动换成了模糊背景：

![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051554130.png)

放一张和默认黑边全屏的对比：

![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051555351.png)

## 反过来用：16:9 横屏看 9:16 竖屏视频（左右填充）

反过来在普通 `16:9` 横屏显示器上看 `9:16` 的手机竖屏视频也是一样的道理，只需要把原本压 Y 轴的坐标换算改成压 X 轴，就能把左右两边的黑边填成模糊背景。

在 `PxShader` 目录里另建一个 `TikTokStyle_Horizontal.txt`，贴入下面这份代码：

```hlsl
// TikTokStyle_Horizontal.txt
// 作者：Moear
// 功能：16:9 横屏显示器播放 9:16 竖屏视频，左右高斯模糊填充

#define VIDEO_AR 0.5625  // 视频比例 (9/16 = 0.5625)
#define SCREEN_AR 1.7777 // 显示器比例 (16/9 = 1.7777)
#define BLUR_SIZE 0.002

sampler s0 : register(s0);

float4 GaussianBlur(float2 texCoord)
{
    float4 color = 0;
    float2 offset[13] = {
        float2(0, 0), float2(-1, 0), float2(1, 0), float2(0, -1), float2(0, 1),
        float2(-2, 0), float2(2, 0), float2(0, -2), float2(0, 2),
        float2(-1, -1), float2(1, 1), float2(-1, 1), float2(1, -1)
    };
    float weight[13] = { 0.2, 0.08, 0.08, 0.08, 0.08, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04 };
    
    // 横屏的模糊方向拉伸修正
    float2 scale = float2(SCREEN_AR, 1.0); 

    for (int i = 0; i < 13; i++)
    {
        color += tex2D(s0, texCoord + offset[i] * BLUR_SIZE * scale) * weight[i];
    }
    return color;
}

float4 main(float2 tex : TEXCOORD0) : COLOR
{
    // 1. 计算水平方向的缩放因子
    float scaleFactor = VIDEO_AR / SCREEN_AR;
    
    // 2. 绘制放大的模糊背景
    float2 bgTex = (tex - 0.5) * 0.8 + 0.5; 
    float4 bgColor = GaussianBlur(bgTex);
    bgColor.rgb *= 0.6; 

    // 3. 映射 X 轴，还原中间主体画面
    float newX = (tex.x - 0.5) / scaleFactor + 0.5;
    
    if (newX >= 0.0 && newX <= 1.0)
    {
        return tex2D(s0, float2(newX, tex.y));
    }
    else
    {
        return bgColor;
    }
}
```

保存后按前面的步骤在 PotPlayer 里勾上（注意和竖屏那个脚本只勾其中一个，别同时开）。效果图 belike：

![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051558614.png)

## 用“配置管理”做成预设快速切换

每次挪窗口到不同屏幕都要手动改宽高比、勾开关还是挺烦的，可以直接用 PotPlayer 自带的 **配置管理** 把这套组合存成一个独立预设：

1. 在播放器画面上点 **右键 -> 配置/语言/其他 -> 配置管理...**，点“新建”起个名字，比如 `Tiktok竖屏`。
![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051559293.png)
2. 选中刚建好的 `Tiktok竖屏` 设为当前激活配置，在这个配置底下勾好调整尺寸后的着色器脚本，再按 `Ctrl + Enter` 把比例定在 **全屏 (拉伸)**。
3. 切回平时的“默认配置”，确认默认配置下没开自定义着色器、宽高比也是正常的默认比例（如果被带歪了按一下 `Ctrl + F5` 就能恢复默认比例）。

存好之后平时在主屏看片就走默认配置，什么时候把播放器拖去竖屏副屏了，右键菜单里点一下切到 `Tiktok竖屏` 就能把拉伸和模糊一次开齐。

## 补充说明

1. **调整屏幕比例或模糊度**：代码最上面留了三个 `#define` 宏，如果你的副屏不是 `1440x2560`（宽高比 `0.5625`），或者嫌背景不够糊，直接改 `SCREEN_AR` 和 `BLUR_SIZE` 的数值就行。
2. **带鱼屏看老片也能用**：比如在 `21:9` 带鱼屏上看 `4:3` 的老番老电视剧，把横屏版脚本里的 `VIDEO_AR` 和 `SCREEN_AR` 换成对应比例，一样能把左右大黑边填成模糊背景。
