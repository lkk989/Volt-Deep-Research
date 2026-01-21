"use client";

import React from "react";
import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";

export const PacketEdge = React.memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeOpacity: 0.1 }} />
      
      {/* Primary Packet */}
      <circle r="2.5" fill="#10b981" className="shadow-[0_0_10px_#10b981]">
        <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath}>
          <mpath href={`#${id}`} />
        </animateMotion>
      </circle>
      
      {/* Staggered Packet 1 */}
      <circle r="1.5" fill="#3b82f6" opacity="0.6">
        <animateMotion dur="1.5s" begin="0.5s" repeatCount="indefinite" path={edgePath} />
      </circle>

      {/* Staggered Packet 2 */}
      <circle r="1.5" fill="#10b981" opacity="0.4">
        <animateMotion dur="1.5s" begin="1s" repeatCount="indefinite" path={edgePath} />
      </circle>

      {/* Glow effect */}
      <circle r="5" fill="#10b981" opacity="0.1">
        <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
});

PacketEdge.displayName = "PacketEdge";
