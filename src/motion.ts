import { useEffect, useRef, useState } from "react";

interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
  precision?: number;
}

const now = () =>
  typeof performance === "undefined" ? Date.now() : performance.now();

export function interpolate(
  value: number,
  input: readonly [number, number],
  output: readonly [number, number],
) {
  const progress = (value - input[0]) / (input[1] - input[0]);
  const clamped = Math.min(1, Math.max(0, progress));
  return output[0] + (output[1] - output[0]) * clamped;
}

export function useSpringNumber(
  target: number,
  {
    stiffness = 420,
    damping = 34,
    mass = 1,
    precision = 0.001,
  }: SpringConfig = {},
  initial = target,
) {
  const [value, setValue] = useState(initial);
  const valueRef = useRef(initial);
  const velocityRef = useRef(0);
  const targetRef = useRef(target);
  const lastPaintedRef = useRef(initial);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(now());

  useEffect(() => {
    targetRef.current = target;
    lastTimeRef.current = now();

    const tick = () => {
      const currentTime = now();
      const dt = Math.min(0.034, (currentTime - lastTimeRef.current) / 1000);
      lastTimeRef.current = currentTime;

      const x = valueRef.current;
      const v = velocityRef.current;
      const destination = targetRef.current;
      const springForce = -stiffness * (x - destination);
      const dampingForce = -damping * v;
      const acceleration = (springForce + dampingForce) / mass;
      const nextVelocity = v + acceleration * dt;
      const nextValue = x + nextVelocity * dt;

      valueRef.current = nextValue;
      velocityRef.current = nextVelocity;

      if (Math.abs(nextValue - lastPaintedRef.current) > precision * 8) {
        lastPaintedRef.current = nextValue;
        setValue(nextValue);
      }

      if (
        Math.abs(nextVelocity) < precision &&
        Math.abs(destination - nextValue) < precision
      ) {
        valueRef.current = destination;
        velocityRef.current = 0;
        lastPaintedRef.current = destination;
        setValue(destination);
        frameRef.current = null;
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [damping, mass, precision, stiffness, target]);

  return value;
}
