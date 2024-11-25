export enum ValKindEnum {
  Spec,
  Conf,
  RO,
  Set
}

export function getValKindEnumByStr (str: string) {
  switch (str) {
    case 'Spec':
      return ValKindEnum.Spec
    case 'Conf':
      return ValKindEnum.Conf
    case 'RO':
      return ValKindEnum.RO
    case 'Set':
      return ValKindEnum.Set
  }
}
