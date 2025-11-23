"use client";

import { AiFillContainer } from "react-icons/ai";
import { RiApps2Line, RiKey2Line, RiSettings2Fill } from "react-icons/ri";

type NodeData = { label: string };

const CARD_COLORS: Record<string, string> = {
  blue: "bg-blue-500/20 border-blue-600/30 text-blue-200",
  rose: "bg-rose-500/20 border-rose-600/30 text-rose-200",
  purple: "bg-purple-500/20 border-purple-600/30 text-purple-200",
  emerald: "bg-emerald-500/10 border-emerald-500/60 text-emerald-300",
};

function Card({
  children,
  color,
  className,
  tootip,
}: {
  children: React.ReactNode;
  color: string;
  className?: string;
  tootip?: string;
}) {
  return (
    <div
      title={tootip}
      className={`
        backdrop-blur-lg shadow-lg rounded-xl relative
        flex flex-col justify-center items-center text-center
        p-4 w-32 h-32
        ${CARD_COLORS[color] ?? CARD_COLORS.blue}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/* ==================== 🎯 Namespace ==================== */
export function k8sNamespace({ data }: { data: NodeData }) {
  return (
    <div
      className={`
        backdrop-blur-md shadow-xl rounded-2xl
        bg-emerald-700/10 border-2 border-emerald-500/60
        flex flex-col p-4 h-full w-full `}
    >
      <div className="flex items-center gap-2">
        <RiApps2Line size={24} className="text-emerald-400" />
        <span className="text-lg font-bold text-emerald-300">{data.label}</span>
      </div>

      <div className="text-xs text-emerald-300/70 mt-1 mb-3">
        Kubernetes Namespace
      </div>
    </div>
  );
}

/* ==================== 🧱 Pod ==================== */
export function k8sPod({ data }: { data: NodeData }) {
  return (
    <Card color="blue" className="h-64 w-64" tootip={data.label}>
      <div className="text-xs text-blue-300/70 absolute top-2 left-2 mt-1 mb-3">
        Kubernetes pod
      </div>

      <AiFillContainer size={48} className="text-blue-300" />
      <span className="text-xs font-semibold text-blue-200 mt-2 break-words w-32">
        {data.label}
      </span>
    </Card>
  );
}

/* ==================== 🔑 Secret ==================== */
export function k8sSecret({ data }: { data: NodeData }) {
  return (
    <Card color="rose" tootip={data.label}>
      <RiKey2Line size={48} className="text-rose-300" />
      <span className="text-xs font-semibold text-rose-200 mt-2 break-words w-32">
        {data.label.length > 30
          ? data.label.slice(0, 30).concat("...")
          : data.label}
      </span>
    </Card>
  );
}

/* ==================== ⚙️ ConfigMap ==================== */
export function k8sConfigmap({ data }: { data: NodeData }) {
  return (
    <Card color="purple" tootip={data.label}>
      <RiSettings2Fill size={48} className="text-purple-300" />
      <span className="text-xs font-semibold text-purple-200 mt-2 break-words w-32">
        {data.label.slice(0, 30)}
      </span>
    </Card>
  );
}

/* ==================== 🧩 Export Types ==================== */
const nodeTypes = {
  k8sNamespace,
  k8sPod,
  k8sConfigmap,
  k8sSecret,
};

export default nodeTypes;
