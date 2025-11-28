import { STORAGE_TAB_KEY } from "@/app/config";
import { Node } from "@/app/types";
import Image from "next/image";
import { Dispatch, ReactElement, SetStateAction, useState } from "react";
import { RiServerFill, RiTerminalBoxLine } from "react-icons/ri";
import kvieLogo from "@/public/kvie.svg";
import Terminal from "../Terminal/Terminal";

export interface optionType {
  name: string;
  color: string;
  icon: ReactElement;
}

export default function SideBar({
  setActiveTab,
  activeTab,
  options,
  k8sNodes,
}: {
  setActiveTab: Dispatch<SetStateAction<string>>;
  k8sNodes: Array<Node>;
  activeTab: string;
  options: Array<optionType>;
}) {
  const [terminalOpen, setTerminalOpen] = useState(false);

  const li = options.map((option, key) => (
    <button
      key={key}
      onClick={() => {
        localStorage.setItem(STORAGE_TAB_KEY, option.name);
        return setActiveTab(option.name);
      }}
      className={`flex cursor-pointer px-3 py-2 items-center gap-5 rounded-md transition ${
        activeTab === option.name
          ? `bg-zinc-700 ${option.color}`
          : "hover:bg-zinc-700 text-gray-400"
      }`}
    >
      {option.icon} {option.name.replace(/\b\w/g, (char) => char.toUpperCase())}
    </button>
  ));

  return (
    <aside className="w-72 bg-zinc-800 border-r justify-between h-screen border-zinc-700 flex flex-col">
      <div>
        <h1 className="flex items-center gap-5 text-xl text-white font-bold px-4 py-4 border-b border-zinc-700">
          <Image src={kvieLogo} alt="kvie logo" width={24} height={24} />
          Kvie
        </h1>
        <nav className="flex flex-col gap-2 p-4">{li}</nav>
      </div>
      <footer className="flex flex-col items-center">
        <button
          className={`bg-zinc-700 ${terminalOpen ? "text-gray-200" : "text-gray-400"} border border-slate-500 rounded-2xl flex justify-center items-center gap-2 font-bold w-[90%] text-center p-2 cursor-pointer `}
          onClick={() => setTerminalOpen((s) => !s)}
        >
          <RiTerminalBoxLine /> Terminal
        </button>
        <div className="bg-blue-200 hover:scale-105 transition cursor-pointer duration-500 w-[90%] rounded-2xl p-2 m-5 font-bold text-blue-600 whitespace-pre-line">
          <div className="flex items-center justify-between">
            <h3>Nodes</h3>
            <i className="animate-pulse">
              <RiServerFill className="text-2xl" />
            </i>
          </div>
          <ul className="text-sm font-normal overflow-y-scroll flex-nowrap h-24">
            {k8sNodes.map((node, key) => (
              <li key={key}>{node.metadata.name}</li>
            ))}
          </ul>
        </div>
        <b className="text-zinc-500 font-bold">with ♥ by finituz&#169;2025</b>
      </footer>
      <Terminal isOpen={terminalOpen} />
    </aside>
  );
}
