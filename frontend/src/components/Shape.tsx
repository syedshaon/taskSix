"use client";

import { Rnd } from "react-rnd";

type ShapeProps = {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

export default function Shape({ type, x, y, width, height, color }: ShapeProps) {
  const renderShape = () => {
    switch (type) {
      case "rectangle":
        return (
          <div
            className="border-2 border-current"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: color,
            }}
          />
        );
      case "circle":
        return (
          <div
            className="rounded-full border-2 border-current"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: color,
            }}
          />
        );
      case "arrow":
        return (
          <div className="relative w-full h-full">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-current" style={{ backgroundColor: color }} />
            <div
              className="absolute right-0 top-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-16 border-l-current"
              style={{
                transform: "translateY(-50%)",
                borderLeftColor: color,
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Rnd
      default={{
        x,
        y,
        width,
        height,
      }}
      bounds="parent"
      className="z-10"
    >
      {renderShape()}
    </Rnd>
  );
}
