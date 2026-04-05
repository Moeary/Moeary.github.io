---
title: "给PotPlayer整点花活：横屏视频变身TikTok风格（竖屏模糊填充）"
date: 2026-02-22 14:00:00 +0800
categories: [折腾, 软件技巧]
tags: [PotPlayer, HLSL, Shader, 视频播放器]
---

## 起因：我的竖屏显示器很寂寞

作为一个练习时长两年半的学生党兼职程序猿，谁桌面上没个竖屏显示器呢？平时敲代码看文档确实爽，但摸鱼...啊不，休息时间想看个番或者电影时，体验就非常割裂了。

横屏视频（16:9）放在竖屏（9:16）上，上下两道巨大的黑边简直比我的黑眼圈还重。

这时候我就在想，能不能像 TikTok 或者 YouTube Shorts 那样，把原本的黑边区域用**高斯模糊的背景**填满？这样虽然画面没变大，但氛围感拉满啊！

## 踩坑之路：AI 也有不靠谱的时候

一开始我去问了大模型，它给我推了一套“重型武器”方案：
1. 安装 **K-Lite Codec Pack**（巨型编解码包）。
2. 启用 **ffdshow** 滤镜。
3. 编写 **AviSynth** 脚本进行实时转码。

我试了一下，效果是有，但代价太大了！不仅要装一堆平时用不到的解码器，而且 AviSynth 是靠 CPU 实时计算的，看个高清视频 CPU 风扇就开始狂转。

**“杀鸡焉用牛刀？”** 我只想要个视觉特效，PotPlayer 自带的 **Pixel Shader（像素着色器）** 不就是干这个的吗？

## 逆向思维：Shader 的魔法

这其实就是给PotPlayer套一个像素着色器(Pixel Shader)处理。PotPlayer 提供了两种着色器挂载点：“调整尺寸前的着色器” (Pre-resize) 和 “调整尺寸后的着色器” (Post-resize)。

![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051547176.png)

(这个界面位于 PotPlayer 的 **右键 -> 视频 -> 像素着色器** 菜单下)

**这两者有什么区别呢？**
*   **调整尺寸前的着色器 (Pre-resize)**：在视频画面被拉伸或缩小以适应你的窗口之前执行。它处理的是**视频的原始分辨率**（比如原视频是 1080p，它就处理 1920x1080 个像素）。适合做一些去色块、锐化等和原画面像素对应的微处理。
*   **调整尺寸后的着色器 (Post-resize)**：在画面已经被拉伸到你的播放器窗口大小之后执行。它处理的是**你当前屏幕/窗口的分辨率**。

*(注：这两者都可以实现本文的模糊效果，但由于两者处理的坐标系不同，你只能选择应用其中**一个**来避免画面被重复处理。本教程推荐使用“调整尺寸后着色器”，这样即便你改变窗口大小，模糊比例也比较好控制。)*

但是还有一个技术难点：默认情况下，**Shader 只能处理有视频画面的区域**。如果你直接写模糊逻辑，PotPlayer 只会在那个扁扁的 16:9 区域里模糊，上下依然是真正的黑边（根本不归 Shader 渲染管辖）。

**解决思路：**
1. **骗过播放器**：先把 PotPlayer 的画面比例强制设为 **“全屏拉伸”**。这时候视频会变形拉伸，强制填满整个屏幕的渲染区域。
2. **Shader 修正**：写一段 HLSL （高级着色语言）程序，在画面渲染时，把中间本来该显示的区域通过坐标换算“缩”回去（还原成正确比例），剩下的区域则继续采样被拉伸扩大的背景，并对其做高斯模糊。

于是，我手搓了一个 `.hlsl` 脚本，完美解决了这个问题！

## 食用方法

### 第一步：创建脚本

在你的电脑PotPlayer的 `PxShader` 文件夹里，新建一个文本文档，命名为 `TikTokStyle.txt`。

![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051549068.png)

(图中所示的文件资源管理器软件为Onecommander,而非大众常见的Windows资源管理器，但操作方法完全一样)

然后把下面的代码复制进去：

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

### 第二步：PotPlayer 设置（关键！）

这步不做，脚本绝对不生效：

1. 打开 PotPlayer。
2. **右键 -> 画面 -> 宽高比 -> 选择【全屏 (拉伸)】**。
   *(或者直接按快捷键 `Ctrl + Enter` 或者 `Ctrl + F6` 切换几次直到看到这个模式)*
   
   此时你的画面会变得非常奇怪（人脸被拉得很长）,可能就像下图一样 ，不用慌，这是正常的。

   ![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051551087.png)

### 第三步：加载 Shader

1. **右键 -> 视频 -> 像素着色 -> 点击调整尺寸后的着色切换**
    *(或者直接使用快捷键 `Ctrl + Alt + P` 切换到“调整尺寸后着色器”)*
4. 再次 **右键 -> 视频 -> 像素着色器 -> 调整尺寸后着色集**，勾选你刚才添加的那个TikTokStyle着色集。
![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051552248.png)


*Duang！* 画面瞬间正常了，中间是标准的 16:9 视频，上下则是氛围感满满的模糊背景。

![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051554130.png)

下面是原版对比(皆为全屏模式):

![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051555351.png)

## 进阶玩法：16:9 横屏显示器看 9:16 竖屏视频（左右填充）

既然能在竖屏上看横屏，那肯定也能在传统的 16:9 电脑显示器上看 9:16 的手机竖屏视频，实现左右模糊填充！
原理一模一样，只不过原本我们是把 Y 轴（上下）压缩回去，现在我们需要把 X 轴（左右）压缩回去。

新建一个 `TikTokStyle_Horizontal.txt`，将代码修改为如下即可：

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
保存后按同样的方式到 PotPlayer 里挂载（记得只能勾选一个，别和之前的混用了），以后在电脑大屏看竖屏视频，就再也不怕两边空荡荡啦。

效果图belike:
![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051558614.png)

## 终极优雅：利用“配置管理”一键无缝切换

每次看不同比例的视频都要去菜单里一点点勾选着色器，顺便还要调画面比例，这也太繁琐了。PotPlayer 强大的**配置切换功能**简直就是为这种场景量身定做的。

通过新建独立配置，我们可以把“开启滤镜+拉伸画面”这套操作固化下来。

1. **新建独立配置**：
   在 PotPlayer 画面上点击 **右键 -> 配置/语言/其他 -> 配置管理...**。点击“新建”，起个名字叫“Tiktok竖屏”（如图所示）。
   ![](https://raw.githubusercontent.com/Moeary/pic_bed/main/img/202604051559293.png)
2. **应用着色器与比例**：
   选中你刚建好的“Tiktok竖屏”配置并将其设为当前配置。接着，在这个配置下，开启我们前面讲的**调整尺寸后着色器（勾选你的 hlsl 脚本）**。同时，按下键盘快捷键 `Ctrl + Enter` 将显示模式切换为**全屏(拉伸)**。
3. **随时随地无缝切换**：
   再切回你的“默认配置”，确保默认配置下**不开启**自己写的着色器，且画面比例为正常状态（不小心拉伸了的话，按一次 `Ctrl + F5` 恢复原始默认比例，或在右键快捷菜单调整回原始比例）。

如此设置之后，你的 PotPlayer 就有了“双重人格”：
- 平时看正常视频，就用默认配置。
- 摸鱼想看竖屏短视频或需要模糊填充时，在菜单里秒切到“Tiktok竖屏”配置，所有特效和拉伸设置一次性自动生效，完美解决日常使用和特殊用途互相干扰的痛点！

## Tips & Tricks

1. **代码里的参数**：我在代码开头留了几个 `#define`，如果你的显示器不是标准的 2K 竖屏（比例不是 0.5625），或者你想让背景更模糊一点，可以直接改那个数字。
2. **不仅限于竖屏**：其实如果你在带鱼屏（21:9）上看 4:3 的老电视节目，改改代码里的 `VIDEO_AR` 和 `SCREEN_AR`，原理也是一样的，可以左右填充模糊。

## 结语

还在等什么呢,快拿Potplayer去试试这个小技巧吧！无论是用来看竖屏视频还是横屏视频，这个模糊填充的效果都能让你的观影体验提升一个档次。以后再也不怕黑边了，整个屏幕都是你的舞台！**看片体验up up！**
