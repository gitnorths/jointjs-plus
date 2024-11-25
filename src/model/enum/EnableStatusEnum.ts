/**
 * 使能状态
 * -1 - 禁用，表示所属板卡不在可选板卡列表
 * 0  - 退出，表示退出状态
 * 1  - 投入，表示投入状态
 * 2  - 脏数据，表示符号可能已经升级
 */
export enum EnableStatusEnum {
  Disabled = -1,
  OFF = 0,
  ON,
  DIRTY
}
