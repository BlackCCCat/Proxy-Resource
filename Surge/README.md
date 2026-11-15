# Surge 资源

## 哔哩哔哩增强·关键词融合

[模块文件](modules/BilibiliUnion.sgmodule) · [配套脚本](scripts/) · [源码补丁](sources/sparkle-keyword.patch)

本模块面向 Surge iOS 上的哔哩哔哩 App。在 [Sparkle 的哔哩哔哩增强模块](https://github.com/kokoryh/Sparkle/blob/master/release/surge/module/bilibili.sgmodule)原有规则、广告清理、界面调整、播放优化、空降助手和皮肤处理基础上，合入 [ElyDemiurge 的 Loon 插件](https://github.com/ElyDemiurge/Loon-Plugins/tree/main/bilibili)的本地关键词匹配逻辑。相同响应只运行一条合并后的脚本，避免两套响应脚本互相覆盖。

模块的全部参数如下，参数名均为中文：

| 参数 | 默认值 | 作用与可选值 |
| --- | --- | --- |
| 动态最常访问 | `auto` | 动态页常访问列表：`auto` 仅有直播时显示，`show` 始终显示，`hide` 隐藏 |
| 创作中心 | `0` | `0` 隐藏创作中心，`1` 显示 |
| 过滤置顶评论广告 | `1` | `1` 过滤，`0` 关闭 |
| 优化评论区加载 | `bilibili.protobuf.request` | 启用评论区请求优化；填 `#` 关闭 |
| 空降助手 | `bilibili.airborne` | 启用空降助手；填 `#` 关闭 |
| 空降助手策略 | `DIRECT` | 空降助手服务使用的 Surge 策略，可填已有策略名称 |
| 屏蔽点对点 | `DEST-PORT` | 按端口拦截点对点连接；填 `#` 关闭 |
| 日志等级 | `4` | `1` 调试、`2` 信息、`3` 警告、`4` 错误、`5` 关闭 |
| 视频标题词 | 空 | 标题包含任一词时过滤推荐、热门、相关推荐及普通视频搜索结果 |
| 屏蔽创作者 | 空 | 创作者名称完整匹配时过滤相关视频及搜索卡片 |
| 动态内容词 | 空 | 按内容过滤关注页动态 |
| 搜索内容词 | 空 | 过滤搜索结果与联想词 |

多个词用英文逗号、竖线或分号分隔。原 Sparkle 参数也保留，名称统一使用中文；`DIRECT`、`DEST-PORT` 等值是 Surge 的策略或规则关键字，按 Surge 语法填写。脚本内部的 JSON 字段名保持原格式。

Loon 的视频 Tag 深度过滤需要额外查询 Tag，可能在响应阶段增加等待；本模块未加入该项。关键词处理仅在本地同步执行。脚本的请求和响应体上限为 1 MiB；超限响应由 Surge 原样透传，超限请求可能被拒绝。原 Sparkle 的评论优化和空降助手仍可能等待上游请求。静态与模拟测试不能保证 iOS 端的加载速度或 VPN 稳定性，实际效果应以真机请求详情和日志为准。

### 安装

[安装哔哩哔哩增强·关键词融合模块](https://raw.githubusercontent.com/BlackCCCat/Proxy-Resource/main/Surge/modules/BilibiliUnion.sgmodule)

模块直接引用本仓库 `Surge/scripts/` 中的脚本，无需另外添加脚本。启用前请确认 Surge 的 HTTPS 解密与证书信任已配置。不要同时启用 Sparkle 原模块；BiliUniverse ADBlock 和 Global 也有重叠接口，需避免重复脚本规则。详细的 Surge 模块行为见[官方文档](https://manual.nssurge.com/profile/module.html)。

### 注意事项
由于Surge多个模块非常容易冲突，导致Surge自动重启且模块无法正常生效，因此才做了合并版，建议关闭其他哔哩哔哩模块（BiliUniverse已测试不冲突可正常使用），并把该脚本置于模块生效列表的最底部

### 上游与致谢

- [kokoryh/Sparkle](https://github.com/kokoryh/Sparkle)：原 Surge 模块、广告和播放相关脚本。基线提交 `d513a2eeab382c640ccd5d6ecd76e07c4828b1ed`；保留 [GPL-3.0 许可证](LICENSE.Sparkle)及可重建的[源码补丁](sources/sparkle-keyword.patch)。
- [ElyDemiurge/Loon-Plugins](https://github.com/ElyDemiurge/Loon-Plugins/tree/main/bilibili)：关键词匹配设计和页面处理依据。基线提交 `86c086e229a129c3c4a5ad0f35d544dd9ad94d40`。
- [kokoryh/Script](https://github.com/kokoryh/Script/blob/master/js/bili-suit-diy.js)：皮肤脚本的 BoxJs 参数约定与功能来源；仓库中的脚本为按该约定编写的兼容实现，处理空编号时不会调用无效的 `trim()`。

构建时在 Sparkle 对应提交应用补丁，执行 `npm install`、`npm run generate`、`npm run build`，将生成的 `bilibili.json.js` 和 `bilibili.protobuf.response.js` 放入 `scripts/`。当前脚本已通过语法检查、TypeScript 检查与模拟输入检查；模块参数渲染后的配置通过 Surge CLI 检查。尚未在 iOS 真机验证。
