---
title: 四张 910B 部署 Qwen3.8-Flash-Next 笔记
date: 2026-11-21 09:30:00 +0800
categories: [Tech, AI]
tags: [tech, ai, ascend, vllm, qwen, codex]
description: 接着上一篇继续记，把四张 64G 昇腾 910B4 跑 Qwen3.8-Flash-Next 的下载、启动参数、调优踩坑和最后接 New API 的过程整理一遍。
---

上一篇《[才华把我埋葬于明天]({% post_url 2026-11-08-才华把我埋葬于明天 %})》写完的时候，我刚从折腾了一周的 `vLLM 0.26.0` 切到官方新发的 `vllm-ascend 0.32.0rc`，四张 910B4 上的单并发 decode 从 18 tok/s 涨到了 26 tok/s，心里还在感叹前几天白干了。

不过机器没闲着。后面一周多（11 月 8 号到 15 号），我继续让 Codex 连着 SSH 往下调，把无 MTP 的单并发 decode 又从 25–26 tok/s 推到了 41 tok/s，顺手给 `vllm-ascend` 提了个性能 issue（[#21341](https://github.com/vllm-project/vllm-ascend/issues/21341)）。原来两套实例占满八张卡，最后也合回了 NPU0–3 一组四卡，腾出来的另外四张卡当天晚上就拿去试跑 AlphaFold3 了。这次把最终跑稳的四卡做法和一路踩过的坑记下来，省得回头自己都忘了。

## 怎么部署的

### 硬件和下载什么

服务器是八张昇腾 910B4-1（Atlas A2，单卡 64 GiB 显存），CPU 192 核，主机内存 500G 出头，宿主机驱动 25.2.3，数据和模型全放在 `/data` 数据盘里。

`Qwen3.8-Flash-Next` 的结构比较特殊。125B 的 MoE 主干，每层 512 个专家激活 10 个，48 层里混着 36 层 GDN 线性注意力和 12 层 QSA 稀疏注意力，另外还带着视觉编码器和一张 51B 参数的 BF16 PLE（n-gram）大词表。光这张词表就占 95.37 GiB，四张 64G 卡一共才 256 GiB 显存，所以核心思路就是只用四张卡（`TP4+EP4`，每卡放 128 个完整专家），把大词表甩到主机内存里，再把 KV 显存上限卡死。

需要提前下好的东西不多：

- 模型权重从魔搭下 ModelSlim 量化好的 W8A8 版 [`Eco-Tech/Qwen3.8-Flash-Next-w8a8-mtp`](https://modelscope.cn/models/Eco-Tech/Qwen3.8-Flash-Next-w8a8-mtp)，一共 75 个文件，约 229 GiB，下完只读挂进容器就行。目录名里带着 `-mtp` 只说明里面包含 MTP 权重，线上没开投机解码。
- 推理镜像直接拉官方的 A2 arm64 镜像 `quay.io/ascend/vllm-ascend`。我们锁定的是 `sha256:f814c05a9f2e03837389772544fe649d120b32d0cf1ce38030e6884680ee7251`，里面已经打好了 vLLM 0.32.0、vLLM-Ascend 0.32 RC、CANN 9.2.1、910B 的 `ops-transformer` 9.3.0 和 `torch-npu 2.10.0.post7`。
- 如果想少碰一点不必要的拒答，还可以顺手去 Hugging Face 下社区提取的 [`Mambavtt/qwen3.8-flash-next-refusal-ablation-vectors`](https://huggingface.co/Mambavtt/qwen3.8-flash-next-refusal-ablation-vectors)，里面那个 `refusal_directions-v4-late.npz` 只有 409 KB（覆盖 4–46 层），靠 hook 在专家求和后做投影就行，不用动原版 W8A8 权重。

拉模型权重直接用 `modelscope` 命令就行：

```bash
modelscope download --model Eco-Tech/Qwen3.8-Flash-Next-w8a8-mtp \
  --local_dir /data/models/Qwen3.8-Flash-Next-w8a8-mtp
```

### 容器和启动参数

起 Docker 容器时有几个选项不能漏。`--ulimit memlock=-1:-1` 必须给足，PLE 词表卸载到主机内存要锁页。设备只挂前四张卡（`davinci0` 到 `davinci3`），加上昇腾的管理设备和宿主驱动目录：

```bash
docker run -d --name qwen38-4card \
  --restart unless-stopped \
  --network host \
  --shm-size 32g \
  --ulimit memlock=-1:-1 \
  --device /dev/davinci0 --device /dev/davinci1 \
  --device /dev/davinci2 --device /dev/davinci3 \
  --device /dev/davinci_manager \
  --device /dev/devmm_svm \
  --device /dev/hisi_hdc \
  -v /data/models/Qwen3.8-Flash-Next-w8a8-mtp:/models/Qwen3.8-Flash-Next-w8a8-mtp:ro \
  -v /usr/local/Ascend/driver:/usr/local/Ascend/driver:ro \
  -v /usr/local/dcmi:/usr/local/dcmi:ro \
  -v /usr/local/sbin/npu-smi:/usr/local/bin/npu-smi:ro \
  -v /etc/ascend_install.info:/etc/ascend_install.info:ro \
  quay.io/ascend/vllm-ascend@sha256:f814c05a9f2e03837389772544fe649d120b32d0cf1ce38030e6884680ee7251 \
  sleep infinity
```

进容器后先 `source` 昇腾环境变量，再拉起 `vllm serve`：

```bash
source /usr/local/Ascend/ascend-toolkit/set_env.sh
source /usr/local/Ascend/nnal/atb/set_env.sh

export ASCEND_RT_VISIBLE_DEVICES=0,1,2,3
export ASCEND_VISIBLE_DEVICES=0,1,2,3
export VLLM_USE_V2_MODEL_RUNNER=1
export OMP_NUM_THREADS=8
export HCCL_BUFFSIZE=200
export TASK_QUEUE_ENABLE=1
export PYTORCH_NPU_ALLOC_CONF=expandable_segments:True

vllm serve /models/Qwen3.8-Flash-Next-w8a8-mtp \
  --host 127.0.0.1 --port 8000 \
  --served-model-name qwen3.8-flash-next \
  --trust-remote-code --quantization ascend \
  --tensor-parallel-size 4 --enable-expert-parallel \
  --pipeline-parallel-size 1 --data-parallel-size 1 \
  --max-model-len 262144 --max-num-seqs 4 \
  --max-num-batched-tokens 8192 \
  --long-prefill-token-threshold 1024 \
  --long-prefill-token-threshold-adaptive \
  --gpu-memory-utilization 0.95 \
  --kv-cache-memory-bytes 21474836480 \
  --mamba-ssm-cache-dtype float32 \
  --enable-prefix-caching --mamba-cache-mode align --block-size 4096 \
  --limit-mm-per-prompt '{"image":999,"video":0}' \
  --mm-processor-kwargs '{"max_pixels":1048576,"min_pixels":786432}' \
  --mm-encoder-tp-mode weights \
  --reasoning-parser qwen3 --enable-auto-tool-choice --tool-call-parser qwen3_xml \
  --engram-config '{"cpu_offload":true,"dp_shared_memory":false}' \
  --compilation-config '{"cudagraph_capture_sizes":[1,2,4],"cudagraph_mode":"FULL_DECODE_ONLY"}' \
  --additional-config '{"enable_cpu_binding":false,"ascend_compilation_config":{"fuse_norm_quant":false} }' \
  --async-scheduling
```

上面这串参数里，真正起决定作用的就几项：

- `--engram-config '{"cpu_offload":true,"dp_shared_memory":false}'` 是 0.32 原生自带的 PLE 卸载开关。开了以后，95.37 GiB 的 BF16 词表会被拆成四份丢进主机内存，每张卡省出 23.84 GiB 显存。
- `--kv-cache-memory-bytes 21474836480` 把每卡 KV 显存手动死锁在 20 GiB，不让 `--gpu-memory-utilization 0.95` 把剩余显存自动吃干。
- `--tensor-parallel-size 4 --enable-expert-parallel` 且不加 `--speculative-config`，四卡同时做张量并行和专家并行，关掉 MTP。
- `--mamba-ssm-cache-dtype float32` 用来保住 GDN 层的递归状态精度，免得输出飘掉。
- `--enable-prefix-caching --mamba-cache-mode align --block-size 4096` 打开前缀缓存，给 OpenCode、Claude Code 这类反复重发长上下文的工具省首字时间。
- `--long-prefill-token-threshold-adaptive` 配 `--max-num-batched-tokens 8192` 用来拉高多并发下的 prefill 分块效率。
- `--async-scheduling` 让 CPU 侧的调度准备和 NPU 推理重叠，这是把单并发 decode 从 25 tok/s 推到 41 tok/s 的主力开关。
- `--limit-mm-per-prompt '{"image":999,"video":0}'` 最早设的 4 图，后来改到 32 图跑视觉任务还是容易撞上限，干脆放宽到了 999。

## 部署和调优踩过的坑

### KV 池别让框架自动占满

最早在 `0.26.0` 上跑四路 256K 压测的时候，跑到第 459 秒直接爆显存退出了。翻日志一看，框架自动划给 KV 池 25.46 GiB，卡上只剩 1.41 GiB，中途算临时张量要 1.88 GiB，就差那四百多兆。

改成手动限死 20 GiB 之后，切上 `0.32.0rc` 初始版本（当时还没开前缀缓存）我们重新测了一遍四路 256K，口径严格按 261,888 输入加 256 输出等于 262,144 总窗口。每卡 1,804 个可用块，四路并发跑完零抢占，峰值只占了 1,192 块（66.08%），卡上还余 6.88 GiB 左右的未分配显存，主机内存也剩 377 GiB 多。

顺带踩过一个小坑：启动日志里会估算出这个池子能跑 6.06 路 256K。这种混合缓存模型的日志估数不能当真，我们只实测过 4 路，从来没拿 6 路去打包票。

### 每次改参数先过固定测试，顺手砍掉三个白忙的改动

前期折腾时很容易测出假收益。换个聊天模板、忘了清缓存，或者拿英文短题的成绩套中文问答，数字看着能差出一大截。

11 月 7 号我让 Codex 把回归流程写成了一个本地 skill，后面每改一个参数都按同一套规矩来：先发 56 组固定好的输入 token ID，贪婪解码逐个核对输出 token ID，差一个就停下来查。接着跑 20 道知识题、12 道非思考推理题和 14 项图片测试。旧基线在那 12 道推理题里本来只答对 6 道，我特意让 Codex 留着这 6 道错题一起测，不换简单题，只要前后对错一模一样，就能确认没把模型改歪。前两关全过，才用固定输入、每条请求带独立 `cache_salt` 的方式测速度。

靠这套规矩，我们在 `0.32.0rc` 上直接砍掉了三个看着有用、实测没赚到的改动。

先试的是 0.32 上的 MTP3。之前在 `0.26.0` 上测同步 MTP 反而慢了 14%，异步 MTP 短测标称 26 tok/s、一换到实际中文聊天就掉回 18 tok/s。升到 `0.32.0rc` 后不死心又测了一轮，2K 中文单并发 decode 只从 25.89 tok/s 提到 28.15（同步）和 27.04（异步），整句只快了 2% 到 5%，干脆彻底关掉。

CPU 绑核（`enable_cpu_binding: true`）也没派上用场。确认线程确实绑上之后跑了四轮一百多批短测，decode 平均只动了 1% 左右，prefill 反而略掉。加上开 PLE 卸载时上游本来就会跳过内存迁移，非特权容器也改不了 IRQ，最后老实保持 `false`。

把 `ACLNN_CACHE_LIMIT` 调大到 `100000` 同样没测出稳定提升。以前在 `0.26.0` 上碰到过 512 短输入 prefill 莫名掉四成的情况，当时查出 rank0 的 `GetWorkspaceSize` 次数暴涨。到 `0.32.0rc` 上从默认 `unset` 改成 `100000` 再改回去做了三轮对照，八个低并发档位里只有两个略快，整体变化不到 0.3%，于是恢复默认 `unset`（CANN 默认 10000）。

### 前缀缓存先回退了一次，后来又手动开回来了

前缀缓存 APC（`block-size=4096`）来回反复过一次。11 月 7 号初测时，16K 热缓存首字时间直接掉了七成多，256K 四路也能跑，但 4K 单并发冷 decode 掉了 6.5%，撞上了我事先定的 6% 红线，Codex 按规矩直接回滚了。

第二天真拿模型接 OpenCode 和 Claude Code 干活时，才发现多轮工具调用每次都要把几万 token 的提示词和文件内容重发一遍，用冷 decode 掉几个百分点换热前缀复用划算得多，于是拍板重新打开。复测 4K 和 8K 输入命中 4,096 token 后，首字时间直接砍半（1.007 秒降到 0.493 秒，1.030 秒降到 0.538 秒），OpenCode 实际跑两轮读文件也在 4 次请求里复用了 24,576 token。

用混合缓存有两个要注意的地方。为了和 SSM 状态对齐，块大小必须是 4,096，短于 4,096 token 的对话不会命中缓存。另外打开 APC 会改变 KV 缓存的分块方式，前面关缓存时测过的四路 256K 容量不能直接当成 APC 的已验证容量。

### Prefill 分块和异步调度

默认的 `max_num_batched_tokens=4096` 和 `long_prefill_token_threshold=1024` 在 2 并发、4 并发下把输入切得太碎，昇腾的 Cube 算力吃不满。先打开 `--long-prefill-token-threshold-adaptive`，2K 和 4K 的双并发 prefill 分别从 2,678 涨到 4,168 tok/s、从 3,040 涨到 5,409 tok/s。接着把 `--max-num-batched-tokens` 拉到 8192，4K 双并发 prefill 又直接涨到了 8,000 tok/s，每张卡显存峰值只多占了约 0.76 GiB，卡上还剩 6 GiB 多余量。

但这两项只救了 prefill，单并发 decode 依然卡在 25 tok/s。抓了一组四卡短 trace 才看清原因：decode 阶段四张卡的设备上满是空洞，CPU 做完同步再准备下一轮调度，把主机和 NPU 串成了一条线。

把 `--no-async-scheduling` 换成 `--async-scheduling` 之后，CPU 准备和 NPU 执行终于重叠上了。2K 中文单并发 decode 直接从 **24.64 跳到 40.92 tok/s**，双并发和四并发也从 22 左右跳到了 **33.85 和 33.44 tok/s**，全程没开 MTP。

不过打开原生异步马上撞出一个真坑：512 长度的四并发突发冷请求，中位首字时间从 0.886 秒拖长到了 1.133 秒（慢了近 28%）。排查时还差点被监控数字骗了，2K 双并发下 vLLM 服务端报的 prefill 速度掉了三成多，客户端实际等首字的时间却根本没变。翻源码才发现服务端算的是 `SCHEDULED → NEW_TOKEN` 这段时间，开异步后排队时间被挪进了这个区间，测异步性能必须以客户端真实首字时间为准。

顺着 `vllm/v1/engine/core.py` 里的 `EngineCore.step_with_batch_queue` 往下查，问题出在队列里已经有新请求的 prefill 在飞、外面还有请求排队时，默认逻辑不等上一批结果回来就提前再发一轮调度，把本来能合并的短突发切碎了。我在 `core.py` 里加了 15 行限定补丁，只在 `qwen4_exp_text`、`PP=1`、`DP=1`、无 MTP 的异步路径下生效：只要队列里有新请求 prefill 在飞且外面还有等待请求，就跳过提前调度，先落回下面把上一批结果取回来再合批，纯 decode 流水完全不动。

```diff
--- a/vllm/v1/engine/core.py
+++ b/vllm/v1/engine/core.py
@@ -721,7 +721,23 @@
 
         model_executed = False
         deferred_scheduler_output = None
-        if self.scheduler.has_requests():
+        # Qwen4Exp no-MTP async: avoid fragmenting a short cold burst into
+        # separate eager prefill waves while its first prefill is in flight.
+        # Retire that result first; steady decode and all other models keep
+        # the upstream two-batch pipeline. Never sleep or alter token budgets.
+        config = getattr(self.scheduler, "vllm_config", None)
+        coalesce_new_prefills = (
+            bool(batch_queue)
+            and config is not None
+            and getattr(getattr(config.model_config, "hf_text_config", None), "model_type", None)
+            == "qwen4_exp_text"
+            and config.speculative_config is None
+            and config.parallel_config.pipeline_parallel_size == 1
+            and config.parallel_config.data_parallel_size == 1
+            and self.scheduler.get_request_counts()[1] > 0
+            and any(output.scheduled_new_reqs for _, output, _ in batch_queue)
+        )
+        if self.scheduler.has_requests() and not coalesce_new_prefills:
             scheduler_output = self.scheduler.schedule(self._should_throttle_prefills())
             with self.log_error_detail(scheduler_output):
                 exec_future = self.model_executor.execute_model(
```

decode 涨五成多靠的其实是原生的 `--async-scheduling`，跟这 15 行补丁没关系。补丁只管拉回短突发的首字时间，而且它头三轮其实还有波动（中位 0.985 秒），后面独立补测 6 轮才全部落回 0.858–0.892 秒（中位 0.872 秒），跟同步版本打平。

怕短文本成绩好看、长文本露馅，11 月 8 号我们在同一组 NPU0–3 上重跑了 32K 到 128K 的中文长上下文测试（固定输出 256 token，全部零抢占），跟刚装好 `0.32.0rc` 的初始状态放在一起看：

| 输入 / 并发 | 0.32 初始 → 调优后 Decode（tok/s/请求） | 0.32 初始 → 调优后 TTFT（秒/请求） | 0.32 初始 → 调优后整批（秒） |
| --- | --- | --- | --- |
| 32K / 1 并发 | 26.02 → 41.25 | 10.34（复测 4.86）→ 4.29 | 20.14（复测 14.77）→ 10.47 |
| 32K / 2 并发 | 22.87 → 33.50 | 15.54 → 7.23 | 26.85 → 15.06 |
| 32K / 4 并发 | 22.41 → 31.22 | 18.97 → 14.75 | 30.48 → 23.65 |
| 64K / 1 并发 | 25.93 → 41.27 | 11.16 → 9.40 | 20.99 → 15.58 |
| 64K / 2 并发 | 22.58 → 33.00 | 30.26 → 17.14 | 41.71 → 25.13 |
| 64K / 4 并发 | 22.23 → 30.95 | 44.12 → 34.68 | 55.74 → 43.83 |
| 128K / 1 并发 | 25.68 → 41.45 | 24.65 → 20.43 | 34.58 → 26.58 |
| 128K / 2 并发 | 23.05 → 32.70 | 61.09 → 38.78 | 72.31 → 46.89 |
| 128K / 4 并发 | 22.14 → 31.07 | 97.67 → 78.01 | 109.37 → 87.30 |

32K 单并发旧版首轮太慢（10.34 秒），复测是 4.86 秒，拿 4.86 秒比才公道，实际首字快了 11.7%。

但四并发下确实冒出了公平性问题。128K 四并发里，第一路请求 71.5 秒就开始吐字，另外三路要到 80.2 秒才出首字，首字错开从原来的 2.94 秒拉宽到了 8.70 秒。早开跑的那一路在另外三路继续算 prefill 时被拖得很慢，最慢一路的 decode 从 18.62 掉到 16.39 tok/s，最长单次卡顿升到 1.35 秒左右，整批输出窗口吞吐比旧版降了 12.2%。混合负载也一样，一条请求正在稳态输出时，中途插进一条 4K 或 8K 冷请求，虽然 p95 延迟看着只有三四十毫秒，实际还是会卡住半秒左右（0.49–0.52 秒）。

平时这台机器大多就一两个并发，单双并发提速太实在，所以四并发公平性先记账不动。11 月 9 号我把全部数据、波动记录和那 15 行补丁整理成英文发了 [vLLM-Ascend Issue #21341](https://github.com/vllm-project/vllm-ascend/issues/21341)，交给上游维护者参考。

### Heretic 投影和合回四张卡

挂上前面提到的 409 KB `.npz` 方向投影后，单独看投影本身的代价很小（prefill 慢 1.6%–6.0%，decode 基本没变），固定 token、知识题、写 Python 函数和图片测试全过。把 `8192 + adaptive + async + 补丁` 同步给 Heretic 之后，它的 2K 中文单双并发 decode 也从 24.87 / 19.99 提到 40.43 / 33.29 tok/s。

之前我们是 NPU0–3 跑普通版、NPU4–7 跑 Heretic。到了 11 月 13 号，既然 Heretic 正常能力和速度都追平了，我就干脆把两套合并成 NPU0–3 一个实例，对外统一叫 `qwen3.8-flash-next`（底层开着 Heretic 投影和 999 图上限），停掉旧容器留着兜底，NPU4–7 四张卡总算彻底空出来了。

## 最后接上 New API 和本地工具

模型本身跑稳之后，还要挂进 New API 方便发 Key，给 Cherry Studio、OpenCode 和 Claude Code 同时用。我们在模型前面套了一层轻量 Python 桥再进 New API，同时暴露 OpenAI `/v1/chat/completions`、`/v1/responses` 和 Anthropic `/v1/messages` 三套接口。看着简单，实际这一层踩的坑一点不比 vLLM 少。

最先遇到的是协议转换的毛病。New API 转格式时会把一条 `system` 消息塞到后面，需要在桥里重排位置。Claude Code 发过来的 `high` 和 `max` 思考档位后端不认，得在代理里映射成 `xhigh`。空对象工具 schema 原本会让模型多吐字段，改走原生 `strict` 后才干净。另外一开始测指定 Chat 工具时，测试脚本报错说结束原因不是 `tool_calls`，翻了 vLLM 0.32 源码才发现指定工具的结束原因本来就是 `stop`，自动选工具才是 `tool_calls`。

最要命的一次故障发生在 11 月 8 号，网关突然全体超时，直连模型端口却秒回。一查网络连接，模型桥里挂着整整 100 条 `CLOSE-WAIT`，刚好顶满 HTTPX 的连接池上限。翻代码发现，之前把 `response.aclose()` 写在了响应体异步生成器的 `finally` 块里。客户端只要在收到响应头、正文生成器还没开始迭代的那一瞬间断开，清理代码根本不会跑，连接就永远占着坑不放。把关闭逻辑挪到 `StreamingResponse.__call__` 外层的 `finally` 并套上 AnyIO 的 cancellation shield 后，跑了一轮四并发 192 次流式压测（中间故意掐断 128 次），又顺带把共享前置代理里一模一样的泄漏给压了出来。两层一起修完，再压测完两边都是 0 条 `CLOSE-WAIT`。

还有一次登录 New API 网页后台直接报错说“超过用户会话上限”，重启容器也不管用。进数据库一看，50 条活跃会话里，有 31 条是之前自动化测试脚本用 `python-requests` 登录后没注销留下的。在数据库里把这 31 条旧会话标成失效，再给运维脚本都加上退出时调用 `DELETE /api/user/sessions/:sid` 的清理钩子，之后就没再满过。

网关稳定之后，我又把服务端的聊天内容日志全关了。这台机器同时给身边人用，聊天原文、图片和工具参数不能留在硬盘上。Docker 给 vLLM 和 New API 容器设了 `--log-driver none`，New API 关了 `LogConsumeEnabled`、`ERROR_LOG_ENABLED` 和调试模式，公网 Nginx 对应站点关掉 `access_log` 和 `error_log`。代理层只打印一行匿名 JSON：`{"at_utc": "...", "event": "api_call", "status": 200}`，不存 IP、账号、Key 和正文。改完后发了 9 组带特殊标记的测试请求，去翻日志和数据库确认都没存下来。

11 月 15 号传多张大图时撞上了 16 MiB 的请求体限制。排查确认卡在网关和反代，vLLM 自己没限制，于是把校内入口、两层 Python 代理、New API（`MAX_REQUEST_BODY_MB=1024`）和公网 Nginx（`client_max_body_size 1024m`）一路拉到 1 GiB。测通 20 MiB 合法请求和超 1 GiB 的 413 拒绝，NPU0–3 上的模型容器全程连重启都没重启。

本地工具这块，我平时主力还是官方 Claude Code（`cc`），日常写小脚本、批处理文件时切到自部署的 910B 能省不少额度。我让 Codex 另开了一个 `ccq` 命令，靠独立的 `CLAUDE_CONFIG_DIR` 把历史记录、缓存和自动记忆跟官方 `cc` 隔开，同时共用同一套 skills 和剪贴板图片插件。接进 VS Code 侧边栏时还踩了个 30 秒超时的坑，查半天发现是本地启动器转发 `stdin` 后忘了逐块 `Flush`，消息卡在缓冲区里了。加上刷新之后初始化回到 0.8 秒左右，四个思考档位和本地模型跑的 Auto 权限审核也都正常了。

这套配置还有几处没测完。打开前缀缓存和 999 图以后，没有重跑完整的四路 256K 满窗压测，也没有试过一次真的塞 999 张图。1 GiB 请求体只验过 20 MiB 合法请求和 413 拒绝，没做完整 1 GiB 上传压测。四并发长输入的公平性和混合负载下半秒左右的停顿，也留着后面有空查 prefill 下发时再看。目前四张卡日常跑 1–2 个并发写代码、看图能稳在 41 tok/s，另外四张卡空出来给别的实验用，先这样用着。

## 写在最后

回过头翻了一下这两周的聊天记录，查源码、写回归脚本、改 `core.py` 补丁、追 `CLOSE-WAIT` 连接泄漏、给上游发 issue 和接 `ccq`，差不多 99% 的活都是 AI 干完的。

我这半个月做得最多的事，就是坐在 Windows 电脑前面敲几句话，让 Codex 连着 910B 去试参数、跑对照、修报错，碰到拿不准的方向再把测试 PDF 丢给 GPT 问一圈，最后看一眼报告点个继续或者回滚。换作以前，光看懂混合缓存的对齐方式、查出异步生成器里的连接泄漏，可能就够我卡上好几天。现在 AI 几十分钟就能把复现脚本、补丁和压测数据一起交出来。

AI 确实已经强到让人有点发怵了。上一篇写《才华把我埋葬于明天》的时候，我还只是难受自己抠了一周的补丁被上游新版本替得太快。再过这一周，四卡服务跑到了 41 tok/s，周边工具全接顺了，连这篇笔记本身都是让 AI 翻着自己留下的历史记录整理出来的。事情是干成了，我坐在屏幕前反而空落落的。

以前还能安慰自己，AI 写代码再快，总得有人定方向、拆问题、做取舍。可照现在这个速度，连下一步该测什么参数、哪个异常优先排查，模型自己都快做得比我稳当了。以后人还能干点什么，未来又该走向哪里，我现在一点数都没有。
