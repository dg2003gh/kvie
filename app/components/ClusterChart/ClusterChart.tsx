"use client";

import React, { useRef, useEffect } from "react";
import "@xyflow/react/dist/style.css";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Node,
  Edge,
  Background,
  Position,
} from "@xyflow/react";
import {
  Configmap,
  Namespace,
  Pod,
  Secret,
  Node as k8sNode,
} from "@/app/types";
import nodeTypes from "../NodeTypes";

export default function PodsChart({
  pods,
  namespaces,
  k8sNodes,
  secrets,
  configmaps,
}: {
  pods: Array<Pod>;
  namespaces: Array<Namespace>;
  k8sNodes: Array<k8sNode>;
  configmaps: Array<Configmap>;
  secrets: Array<Secret>;
}) {
  const nodeOrigin: [number, number] = [0.5, 0];

  const AddNodeOnEdgeDrop = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const reactFlowWrapper = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const nodesEdges: Edge[] = [];

      const COLS = 3;
      const NODE_W = 500;
      const NODE_H = 600;
      const GAP = 50;
      const MAX_PODS_PER_GROUP = 12;

      function rowsNeeded(podCount: number): number {
        if (podCount <= COLS) return 1;

        return Math.ceil(podCount / COLS);
      }

      function calcNsSize(podCount: number) {
        const groups = Math.ceil(podCount / MAX_PODS_PER_GROUP);

        const podsPerGroup = Math.min(podCount, MAX_PODS_PER_GROUP);
        const rows = rowsNeeded(podsPerGroup);

        const width =
          (COLS * NODE_W + (COLS - 1) * GAP) * groups + (groups - 1) * GAP;
        const height = rows * NODE_H + (rows - 1) * GAP;

        return { width: width + 80, height: height + 80, groups };
      }

      let lastOffsetY = 0;
      let currentNSSize = { x: 0, y: 0 };

      const namespaceNodes: Node[] = namespaces.map((ns) => {
        const podCount = pods.filter(
          (pod) => pod.metadata.namespace === ns.metadata.name,
        ).length;

        const { width, height } = calcNsSize(podCount);
        currentNSSize = { x: width, y: height };

        const node: Node = {
          id: `ns-${ns.metadata.name}`,
          type: "k8sNamespace",
          data: { label: `Namespace ${ns.metadata.name}` },
          position: { x: 0, y: lastOffsetY },
          style: { minWidth: width, height },
          sourcePosition: Position.Right,
        };

        lastOffsetY += height + 150;

        return node;
      });

      let cellSize = { x: 126, y: 126 };
      let gap = 20;
      let count = 0;
      let prevNS: string;

      const secretNodes: Node[] = secrets
        .sort((a, b) =>
          a.metadata.namespace.localeCompare(b.metadata.namespace),
        )
        .map((sc) => {
          if (prevNS != sc.metadata.namespace) {
            count = 0;
          }

          const y = 100 + count * (cellSize.y + gap);
          count++;

          prevNS = sc.metadata.namespace;

          return {
            id: `sc-${sc.metadata.name}`,
            type: "k8sSecret",
            data: { label: `Secret ${sc.metadata.name}` },
            position: {
              x: 100,
              y,
            },
            parentId: `ns-${sc.metadata.namespace}`,
            sourcePosition: Position.Right,
            extent: "parent",
          };
        });

      count = 0;
      const configmapNodes: Node[] = configmaps
        .sort((a, b) =>
          a.metadata.namespace.localeCompare(b.metadata.namespace),
        )
        .map((cm) => {
          if (prevNS != cm.metadata.namespace) {
            count = 0;
          }

          const x = 100 + count * (cellSize.x + gap);
          count++;

          prevNS = cm.metadata.namespace;

          return {
            id: `cm-${cm.metadata.name}`,
            type: "k8sConfigmap",
            data: { label: `Configmap ${cm.metadata.name}` },
            position: { x, y: currentNSSize.y - 100 },
            parentId: `ns-${cm.metadata.namespace}`,
            sourcePosition: Position.Right,
            extent: "parent",
          };
        });

      count = 0;
      cellSize = { x: 252, y: 252 };
      gap = 200;
      const itemsPerRow = 5;

      const podNodes: Node[] = pods
        .sort((a, b) =>
          a.metadata.namespace.localeCompare(b.metadata.namespace),
        )
        .map((pod) => {
          if (prevNS !== pod.metadata.namespace) {
            count = 0;
          }

          const col = count % itemsPerRow;
          const row = Math.floor(count / itemsPerRow);
          count++;

          prevNS = pod.metadata.namespace;

          return {
            id: `pod-${pod.metadata.uid}`,
            type: "k8sPod",
            data: { label: pod.metadata.name },
            position: {
              x: 500 + col * (cellSize.x + gap),
              y: 100 + row * (cellSize.y + gap),
            },
            parentId: `ns-${pod.metadata.namespace}`,
            sourcePosition: Position.Right,
            extent: "parent",
          };
        });

      setNodes((nds) => nds.concat(namespaceNodes));
      setNodes((nds) => nds.concat(configmapNodes));
      setNodes((nds) => nds.concat(secretNodes));
      setNodes((nds) => nds.concat(podNodes));
      setEdges((e) => e.concat(nodesEdges));
    }, [setNodes, setEdges]);

    return (
      <div className="bg-zinc-900 w-full h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeOrigin={nodeOrigin}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
        >
          <Background />
        </ReactFlow>
      </div>
    );
  };

  return (
    <ReactFlowProvider>
      <AddNodeOnEdgeDrop />
    </ReactFlowProvider>
  );
}
