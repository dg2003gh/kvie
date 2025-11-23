import { RiSettings2Line } from "react-icons/ri";
import Dropdown from "../DropDown/DropDown";

export default function Settings() {
  return (
    <section className="flex flex-col w-full h-full p-5 gap-10 bg-zinc-900 overflow-y-scroll">
      <h1 className="flex gap-5 items-center text-white text-2xl font-bold">
        <RiSettings2Line />
        Settings
      </h1>
      <div className="flex flex-col">
        <h2 className="text-xl font-semibold mb-2 text-slate-300">General</h2>
        <ul className="bg-zinc-950 h-fit rounded-lg shadow divide-y overflow-y-scroll text-white">
          <li className="p-3 flex justify-between cursor-pointer">Timezone:</li>
          <li className="p-3 flex justify-between cursor-pointer">
            Auto-update every:
            <Dropdown defaultValueId="30">
              <li id="30">30 seconds</li>
              <li>1 minute</li>
              <li>5 minutes</li>
              <li>10 minutes</li>
              <li>15 minutes</li>
              <li>30 minutes</li>
            </Dropdown>
          </li>
          <li className="p-3 flex justify-between cursor-pointer">
            Keep logs period:
          </li>
          <li className="p-3 flex justify-between cursor-pointer">
            Keep status history period:
          </li>
          <li className="p-3 flex justify-between cursor-pointer">
            Keep events period:
          </li>
        </ul>
      </div>
      <div className="flex flex-col ">
        <h2 className="text-xl font-semibold mb-2 text-slate-300">Webhook</h2>
        <ul className="bg-zinc-950 h-96 rounded-lg shadow divide-y overflow-y-scroll text-white"></ul>
      </div>
      <div className="flex flex-col text">
        <h2 className="text-xl font-semibold mb-2 text-slate-300">About</h2>
        <p className="text-white text-xl my-10">
          Kvie is an monitoring tool for Kubernetes. Given acess to logs,
          cluster structure, alerts and insights about your cluster components.
        </p>
        <ul className="bg-zinc-950 h-fit rounded-lg shadow divide-y overflow-y-scroll text-white">
          <li className="p-3 flex justify-between cursor-pointer">
            Application version: v1-beta
          </li>
          <li className="p-3 flex justify-between cursor-pointer">
            Frontend NextJS version: 15.2
          </li>
          <li className="p-3 flex justify-between cursor-pointer">
            Backend Go version: 1.22.2
          </li>
          <li className="p-3 flex justify-between cursor-pointer">
            K8S API tested version: 1.32
          </li>
          <li className="p-3 flex justify-between cursor-pointer">
            Database: SQLite
          </li>
        </ul>
      </div>
    </section>
  );
}
