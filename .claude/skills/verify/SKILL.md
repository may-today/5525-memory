---
name: verify
description: How to launch and drive 5525 Memory locally to verify /summary card changes end-to-end in a real browser.
---

# Verify 5525 Memory

## Launch

```bash
bunx wrangler d1 migrations apply 5525-memory-db --local   # 只在新环境需要
bun run dev                                                # Vite + Miniflare, http://localhost:5173
```

`.dev.vars` 已存在（含 STATS_OPEN_AT 覆盖）；本地 D1 在 `.wrangler/state/v3/d1`。

## 驱动 /summary（需要已选场次）

1. 先访问 `http://localhost:5173/` 让 origin 就绪，然后在页面 JS 里播种 localStorage 再跳转：

```js
localStorage.setItem('concert-form-data:v1', JSON.stringify({
  profile: { nickname: '', city: '台湾', coordinates: null },
  showIds: [266, 267, 268, 270],        // 台中 4 场，本地 D1 真实 id
  showIndexes: [0, 1, 2, 4],
}))
location.href = '/summary'
```

2. 切卡：键盘监听在 window 上，合成事件可用。每张卡先把 `[data-scroll-container]` 滚到底才能前进；切页动画 1050ms：

```js
for (const el of document.querySelectorAll('[data-scroll-container]')) el.scrollTo(0, el.scrollHeight)
window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
// 每次之间等 ~1300ms
```

卡片顺序见 `journey/design.md`「统计页面设计」。

## 坑

- **后台标签页不派发 WAAPI finish 事件**（`document.hidden` 时 `onfinish`/`finished` 都不触发），动画驱动的状态转移必须有 setTimeout 兜底才能在自动化里稳定；后台 setTimeout 也被节流到 ≥1s，断言等待放宽到 ~2s。
- 场次 id 查询：`bunx wrangler d1 execute 5525-memory-db --local --command "SELECT id, city, show_date FROM shows WHERE is_hidden = 0 ORDER BY show_date ASC LIMIT 6" --json`（隐藏列叫 `is_hidden`，不是 `hidden`）。
