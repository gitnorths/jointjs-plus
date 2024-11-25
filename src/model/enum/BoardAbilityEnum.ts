export enum BoardAbilityEnum {
  BI,
  BO,
  BO_H,
  BIO,
  CPU,
  PWR,
  HMI,
  SG,
  FDL,
  AI,
  AC,
  SCPU,
  DSP,
  PBIO,
  SBIO,
  AO,
  MAIN,
  COM,
  BP
}

export function getBoardAbilityEnumString (type: BoardAbilityEnum) {
  switch (type) {
    case BoardAbilityEnum.BI:
      return 'BI'
    case BoardAbilityEnum.BO:
      return 'BO'
    case BoardAbilityEnum.BO_H:
      return 'BO_H'
    case BoardAbilityEnum.BIO:
      return 'BIO'
    case BoardAbilityEnum.CPU:
      return 'CPU'
    case BoardAbilityEnum.PWR:
      return 'PWR'
    case BoardAbilityEnum.HMI:
      return 'HMI'
    case BoardAbilityEnum.SG:
      return 'SG'
    case BoardAbilityEnum.FDL:
      return 'FDL'
    case BoardAbilityEnum.AI:
      return 'AI'
    case BoardAbilityEnum.AC:
      return 'AC'
    case BoardAbilityEnum.SCPU:
      return 'SCPU'
    case BoardAbilityEnum.DSP:
      return 'DSP'
    case BoardAbilityEnum.PBIO:
      return 'PBIO'
    case BoardAbilityEnum.SBIO:
      return 'SBIO'
    case BoardAbilityEnum.AO:
      return 'AO'
    case BoardAbilityEnum.MAIN:
      return 'MAIN'
    case BoardAbilityEnum.COM:
      return 'COM'
    case BoardAbilityEnum.BP:
      return 'BP'
    default:
      return 'Unknown'
  }
}
