---
title: LINUX_KERNEL_MODULE_INIT
date: 2024-03-21 13:04:00 +0800
categories: [Tech,Linux]
tags: [tech]     # TAG names should always be lowercase
---
### 写在前头的话

在开始学习 LINUX 内核编程之前，我们需要了解一些基本的操作系统和编程知识。这将帮助我们更好地理解和使用 LINUX 内核。

### 什么是LINUX内核编程

LINUX 内核编程是指直接与 LINUX 内核交互的编程。这通常涉及到使用系统调用、编写设备驱动、修改内核源代码等。

### 用户层编程和内核编程模块的区别

|            | 应用程序 | 内核模块程序 |
|------------|----------|--------------|
| 使用函数   | libc库   | 内核函数     |
| 运行空间   | 用户空间 | 内核空间     |
| 运行权限   | 普通用户 | 超级用户     |
| 入口函数   | main()   | module_init()|
| 出口函数   | exit()   | module_exit()|
| 编译       | gcc      | makefile     |
| 链接       | gcc      | insmod       |
| 运行       | ./a.out  | insmod       |
| 调试       | gdb      | kdbug、kdb、kgdb |

### 简单的教程

#### 创建一个简单的模块

首先，我们需要创建一个简单的模块。以下是一个简单的模块的代码：

```c
#include <linux/init.h>
#include <linux/module.h>

static int __init hello_init(void)
{
    printk(KERN_INFO "Hello, world!\n");
    return 0;
}

static void __exit hello_exit(void)
{
    printk(KERN_INFO "Goodbye, world!\n");
}

module_init(hello_init);
module_exit(hello_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("A simple Hello World module");

这个模块在加载时会打印 "Hello, world!"，在卸载时会打印 "Goodbye, world!"。
```
#### 编译模块
要编译这个模块，我们需要创建一个 Makefile。以下是一个简单的 Makefile：
```c
obj-m += hello.o

all:
    make -C /lib/modules/$(shell uname -r)/build M=$(PWD) modules

clean:
    make -C /lib/modules/$(shell uname -r)/build M=$(PWD) clean
```
然后，我们可以使用 make 命令来编译这个模块。

#### 加载和卸载模块

我们可以使用 insmod 命令来加载这个模块，使用 rmmod 命令来卸载这个模块。例如：
```
sudo insmod hello.ko
sudo rmmod hello
```

加载模块后，我们可以使用 dmesg 命令来查看模块打印的信息

### 编译LINUX内核和内核编译的区别

编译 LINUX 内核是指**将内核源代码编译成可执行文件**的过程,比如你可以根据[我是Linux Kernel0.11](https://github.com/yuan-xy/Linux-0.11)

而内核编译则是指**内核在运行时动态编译和加载模块**的能力。

### UEFI?

而UEFI的编译程序和内核编译很相似 都是利用C语言写的,都得手写一大串东西,还得编写Makefile才能生成,非常烦人
UEFI编程：

UEFI（统一可扩展固件接口）是一种规范，定义了操作系统和平台固件之间的软件接口。这种接口用于在操作系统加载之前初始化硬件设备，并启动操作系统的引导加载程序。

* UEFI编程通常涉及到编写在系统引导阶段运行的代码。这可能包括初始化硬件设备、设置内存映射、加载操作系统引导加载程序等。

* UEFI编程通常使用C语言，但也可以使用其他语言，如汇编语言。

* UEFI编程需要对底层硬件和系统引导过程有深入的理解。

内核编译：

* 内核编译是指将内核源代码编译成可执行的内核映像的过程。这个过程通常涉及到配置内核选项、编译内核源代码、链接内核对象文件等步骤。

* 内核编译通常使用C语言，但也可能涉及到汇编语言和其他语言。

* 内核编译需要对操作系统原理和C语言有深入的理解。

**相同点**：

两者都涉及到底层系统编程，都需要使用C语言，都需要对硬件和系统有深入的理解。

**不同点**：

UEFI编程主要关注系统引导阶段，而内核编译主要关注操作系统的运行。UEFI编程通常涉及到硬件初始化和系统引导，而内核编译通常涉及到操作系统功能的实现。此外，两者在编程模型、API、可用的库等方面也有所不同。

UEFI编程可以参考[ekd2](https://github.com/tianocore/edk2)

然后国内的罗冰老师也有类似的UEFI编程数据,可以先看看他的教程再决定要不要买书[我是知乎链接](https://zhuanlan.zhihu.com/p/405897922)

### 现状分析

目前，LINUX 内核编程是一个活跃的研究领域，有许多开源项目和商业产品都在使用。然而，由于其复杂性和需要深入理解硬件和操作系统的要求，它也是一个挑战性的领域。
