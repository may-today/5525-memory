# 统计卡顶部滚动遮罩与标题区之间的 4px 缝隙修复

## 问题

四张带页内滚动的统计卡（Overview / Playlist / SongWall / RareSongs）滚动后，
`SummaryScrollFadeTop` 渐变遮罩顶部与固定标题区之间有 4px 缝隙，滚上来的内容
会从缝隙里露出硬切边。

## 根因

滚动容器带 `pt-1`（4px）。Chrome 中 `position: sticky; top: 0` 的钉住位置以
滚动容器自身 padding-top 的内边缘为锚点，而不是容器可视区顶边——遮罩因此被
压低 4px。实测：标题底 63.5 / 容器顶 63.5 / 遮罩顶 67.5。

## 修复

把这 4px 从滚动容器挪进标题区：标题块 `pb-3 → pb-4`，滚动容器去掉 `pt-1`。
初始渲染的视觉间距不变（12+4 = 16px），sticky 遮罩贴齐容器顶。约束已写进
`SummaryScrollFadeTop` 的 JSDoc：滚动容器不能有 top padding。

浏览器实测三者均为 67.5，视觉无缝。
