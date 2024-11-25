export abstract class TreeNode<P, C> {
  parent: P | undefined
  children: C[] = []
  title: string | undefined

  abstract setTitle (): void;

  abstract initChildren (): void;
}
