/** Autoplay is allowed only when all attention and motion preferences agree. */
export function shouldPlayDemo(inView: boolean, pageHidden: boolean, motionAllowed: boolean, userPaused: boolean): boolean {
  return inView && !pageHidden && motionAllowed && !userPaused
}
