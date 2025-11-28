import { Dispatch, ReactElement, SetStateAction, useState } from "react";
import { RiBox1Line, RiSearch2Line } from "react-icons/ri";
import Dropdown from "../DropDown/DropDown";
import { Pod, Container } from "@/app/types";

export interface Selects {
  name: string;
  icon: ReactElement;
  call?: (...args) => void;
  checkbox?: boolean;
  options: any;
}

export default function Filters({
  selects,
  children,
  setSearch,
  setLog,
}: {
  selects: Array<Selects>;
  children?: ReactElement;
  setSearch: Dispatch<SetStateAction<string>>;
  setLog: Dispatch<SetStateAction<string>>;
}) {
  const [selectedPod, setSelectedPod] = useState<Pod>();

  const createSelect = selects.map((select, key) => {
    return (
      <Dropdown icon={select.icon} key={key} defaultValueId={""}>
        {select.options.map((opt: any, key: number) =>
          select.checkbox ? (
            <label key={key} className="flex gap-2">
              <input
                value={opt.name}
                onClick={() => opt.call(!opt.state)}
                onChange={(e) => {
                  e.target.checked = opt.state;
                }}
                type="checkbox"
                checked={opt?.state}
              />
              {opt.name}
            </label>
          ) : (
            <button
              key={key}
              className="w-full h-full text-left"
              onClick={() => {
                if (
                  (opt.spec == null || opt.spec.containers.length == 1) &&
                  select.call
                ) {
                  select.call(opt);
                } else {
                  setLog("chooseContainer");
                }

                setSelectedPod(opt);
              }}
            >
              {opt.metadata?.name || opt}
            </button>
          ),
        )}
      </Dropdown>
    );
  });

  return (
    <div className="text-white">
      <h3 className="text-xl font-bold text-slate-300">Filters</h3>
      <ul className="flex items-center justify-between rounded-2xl bg-zinc-950 border-1 gap-5 border-slate-700 p-2">
        <li className="relative">
          <RiSearch2Line className="absolute top-2 left-2" />
          <input
            className="text-white pl-7 py-1 border-slate-700 border-1 rounded-2xl w-full"
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="Search..."
          />
        </li>
        <ul className="flex gap-2">
          {children}
          {selectedPod?.spec &&
          selectedPod?.spec.containers.length &&
          selectedPod.spec.containers.length > 1 ? (
            <Dropdown icon={<RiBox1Line />} defaultValueId={""}>
              <button
                onClick={() => selects[0].call && selects[0].call(selectedPod)}
                className="w-full h-full"
              >
                all containers
              </button>
              {selectedPod.spec.containers.map(
                (container: Container, key: number) => (
                  <button
                    key={key}
                    className="w-full text-left h-full"
                    onClick={() =>
                      selects[0].call &&
                      selects[0].call(selectedPod, container.name)
                    }
                  >
                    {container.name}
                  </button>
                ),
              )}
            </Dropdown>
          ) : null}
          {createSelect}
        </ul>
      </ul>
    </div>
  );
}
