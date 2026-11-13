/**
 * Pure 3D flashcard animation & pointer tilt math utilities.
 */

export interface CardTiltState {
  rotateX: number;
  rotateY: number;
  glareX: number;
  glareY: number;
  glareOpacity: number;
}

export interface CardBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const DEFAULT_CARD_TILT: CardTiltState = {
  rotateX: 0,
  rotateY: 0,
  glareX: 50,
  glareY: 50,
  glareOpacity: 0,
};

/**
 * Computes responsive 3D perspective tilt angles (rotateX / rotateY) and specular
 * glare coordinates from pointer position relative to the card bounding box.
 */
export function calculateCardTilt(
  clientX: number,
  clientY: number,
  bounds: CardBounds,
  maxTiltDeg = 8
): CardTiltState {
  if (bounds.width <= 0 || bounds.height <= 0) {
    return DEFAULT_CARD_TILT;
  }

  const rawX = (clientX - bounds.left) / bounds.width;
  const rawY = (clientY - bounds.top) / bounds.height;

  const normX = Math.max(0, Math.min(1, rawX));
  const normY = Math.max(0, Math.min(1, rawY));

  // Map [0, 1] -> [-1, 1]
  const centeredX = (normX - 0.5) * 2;
  const centeredY = (normY - 0.5) * 2;

  // Natural 3D tilt: pushing top tilts backward (+rotateX), pushing right tilts right (+rotateY)
  const rotateX = Number((-centeredY * maxTiltDeg).toFixed(2));
  const rotateY = Number((centeredX * maxTiltDeg).toFixed(2));

  return {
    rotateX,
    rotateY,
    glareX: Number((normX * 100).toFixed(1)),
    glareY: Number((normY * 100).toFixed(1)),
    glareOpacity: 0.14,
  };
}

export type CardSwapDirection = 'next' | 'prev' | 'shuffle';

export interface Card3DTransitionState {
  initial: {
    opacity: number;
    x: number;
    y: number;
    scale: number;
    rotateY: number;
    rotateX: number;
    rotateZ: number;
  };
  animate: {
    opacity: number;
    x: number;
    y: number;
    scale: number;
    rotateY: number;
    rotateX: number;
    rotateZ: number;
  };
  exit: {
    opacity: number;
    x: number;
    y: number;
    scale: number;
    rotateY: number;
    rotateX: number;
    rotateZ: number;
  };
}

/**
 * Produces 3D spatial entry/exit keyframe targets for card navigation and shuffle.
 */
export function getCard3DTransition(direction: CardSwapDirection): Card3DTransitionState {
  if (direction === 'shuffle') {
    return {
      initial: {
        opacity: 0,
        x: 0,
        y: -26,
        scale: 0.88,
        rotateY: -22,
        rotateX: 12,
        rotateZ: -4,
      },
      animate: {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotateY: 0,
        rotateX: 0,
        rotateZ: 0,
      },
      exit: {
        opacity: 0,
        x: 0,
        y: 28,
        scale: 0.88,
        rotateY: 22,
        rotateX: -12,
        rotateZ: 4,
      },
    };
  }

  const sign = direction === 'next' ? 1 : -1;
  return {
    initial: {
      opacity: 0,
      x: 72 * sign,
      y: 8,
      scale: 0.92,
      rotateY: 16 * sign,
      rotateX: 4,
      rotateZ: 2 * sign,
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotateY: 0,
      rotateX: 0,
      rotateZ: 0,
    },
    exit: {
      opacity: 0,
      x: -72 * sign,
      y: -8,
      scale: 0.92,
      rotateY: -16 * sign,
      rotateX: -4,
      rotateZ: -2 * sign,
    },
  };
}
