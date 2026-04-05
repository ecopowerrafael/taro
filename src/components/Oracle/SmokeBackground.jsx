import React, { useCallback } from 'react';
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export function SmokeBackground() {
  const particlesInit = useCallback(async engine => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="tsparticles-smoke"
      init={particlesInit}
      className="absolute inset-0 z-0 pointer-events-none mix-blend-screen"
      options={{
        fullScreen: { enable: false, zIndex: 0 },
        fpsLimit: 60,
        particles: {
          number: {
            value: 40,
            density: {
              enable: true,
              area: 800,
            },
          },
          color: {
            value: ["#ffffff", "#aa88ff", "#5500aa"],
          },
          shape: {
            type: "circle",
          },
          opacity: {
            value: { min: 0.1, max: 0.3 },
            animation: {
              enable: true,
              speed: 1,
              sync: false,
            },
          },
          size: {
            value: { min: 50, max: 150 },
            animation: {
              enable: true,
              speed: 2,
              sync: false,
            },
          },
          move: {
            enable: true,
            speed: 1.5,
            direction: "none",
            random: false,
            straight: false,
            outModes: "out",
          },
          filter: {
            type: "blur",
            value: 15,
          },
        },
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "slow"
            }
          },
          modes: {
            slow: {
              factor: 3,
              radius: 200,
            }
          }
        },
        background: {
          color: "transparent"
        }
      }}
    />
  );
}
