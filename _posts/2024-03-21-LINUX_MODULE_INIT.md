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

UEFI（统一可扩展固件接口）是一种 PC 固件标准，用于连接操作系统和平台固件。它提供了一种在操作系统加载之前运行代码的方法，可以用于初始化硬件、引导操作系统等。

而UEFI的编译程序和内核编译很相似 都是利用C语言写的,都得手写一大串东西,还得编写Makefile才能生成,非常烦人

UEFI编程可以参考[ekd2](https://github.com/tianocore/edk2)

然后国内的罗冰老师也有类似的UEFI编程数据,可以先看看他的教程再决定要不要买书[我是知乎链接](https://zhuanlan.zhihu.com/p/405897922)

### 现状分析

目前，LINUX 内核编程是一个活跃的研究领域，有许多开源项目和商业产品都在使用。然而，由于其复杂性和需要深入理解硬件和操作系统的要求，它也是一个挑战性的领域。
