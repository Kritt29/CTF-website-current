/** Mutable render state: animation never causes React renders. Page 02 can consume progress/route. */
export interface SceneState {
  progress: number;
  reveal: number;
  reduced: boolean;
}
