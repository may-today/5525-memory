# Form 持久化恢复日志

- 排查刷新后场次选择丢失：`/form` 挂载时先调用 `hydrateConcertProfile()`，该函数写入 store 后触发订阅器持久化；当时 `selectedShows` 仍为空，因此会把 `concert-form-data:v1` 里的 `showIds` 覆盖成 `[]`。
- 在 `src/stores/concert-store.ts` 加入恢复期保护：hydrate 写 store 时跳过订阅器自动持久化，场次恢复完成后再显式写回完整 `{ profile, showIds }`。
- 保持显式 `clearSelectedShows()` 行为不变：用户主动清空时仍会通过正常订阅器把 `showIds` 写成空数组。
