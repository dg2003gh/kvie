"use client";

import { useState, useEffect } from "react";
import {
  RiAlertLine,
  RiFlowChart,
  RiHeartPulseLine,
  RiNewspaperFill,
  RiNotification2Line,
  RiSettings2Line,
} from "react-icons/ri";
import PodMindMap from "./components/ClusterChart/ClusterChart";
import Sidebar from "./components/SideBar/SideBar";
import Monitoring from "./components/monitoring/monitoring";
import { E_TABS, PROXY_HOST, STORAGE_TAB_KEY } from "./config";
import Notifications from "./components/Notifications/Notifications";
import Insights from "./components/Insights/Insights";
import Settings from "./components/Settings/Settings";
import Logs from "./components/Logs/Logs";
import { Pod, Node, Namespace, Configmap, Secret } from "./types";

export default function Home() {
  const [pods, setPods] = useState<Pod[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [configmaps, setConfigmap] = useState<Configmap[]>([]);
  const [activeTab, setActiveTab] = useState<string>(E_TABS.TOPOLOGY);

  useEffect(() => {
    const cachedTab = localStorage.getItem(STORAGE_TAB_KEY);
    if (cachedTab) setActiveTab(cachedTab);
  }, []);

  useEffect(() => {
    fetch(`${PROXY_HOST}/api/v1/pods`)
      .then((res) => res.json())
      .then((json) => setPods(json.items))
      .catch((err) => console.error(err));

    fetch(`${PROXY_HOST}/api/v1/nodes`)
      .then((res) => res.json())
      .then((data) => setNodes(data.items || []));

    fetch(`${PROXY_HOST}/api/v1/namespaces`)
      .then((res) => res.json())
      .then((data) => setNamespaces(data.items || []));

    fetch(`${PROXY_HOST}/api/v1/secrets`)
      .then((res) => res.json())
      .then((data) => setSecrets(data.items || []));

    fetch(`${PROXY_HOST}/api/v1/configmaps`)
      .then((res) => res.json())
      .then((data) => setConfigmap(data.items || []));
  }, []);

  const options = [
    {
      name: E_TABS.MONITORING,
      color: "text-orange-300",
      icon: <RiHeartPulseLine />,
    },
    {
      name: E_TABS.TOPOLOGY,
      color: "text-green-300",
      icon: <RiFlowChart />,
    },
    {
      name: E_TABS.NOTIFICATIONS,
      color: "text-pink-300",
      icon: <RiNotification2Line />,
    },
    {
      name: E_TABS.INSIGHTS,
      color: "text-red-300",
      icon: <RiAlertLine />,
    },
    {
      name: E_TABS.LOGS,
      color: "text-purple-300",
      icon: <RiNewspaperFill />,
    },
    {
      name: E_TABS.SETTINGS,
      color: "text-zinc-200",
      icon: <RiSettings2Line />,
    },
  ];

  const tab = () => {
    switch (activeTab) {
      case E_TABS.TOPOLOGY:
      default:
        return (
          <PodMindMap
            pods={pods}
            namespaces={namespaces}
            secrets={secrets}
            configmaps={configmaps}
            k8sNodes={nodes}
          />
        );
      case E_TABS.MONITORING:
        return <Monitoring pods={pods} nodes={nodes} />;
      case E_TABS.NOTIFICATIONS:
        return <Notifications />;
      case E_TABS.INSIGHTS:
        return <Insights />;
      case E_TABS.SETTINGS:
        return <Settings />;
      case E_TABS.LOGS:
        return <Logs pods={pods} />;
    }
  };

  return (
    <div className="flex flex-row font-sans h-screen bg-zinc-50">
      <Sidebar
        k8sNodes={nodes}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        options={options}
      />

      <main className="w-full h-full">{tab()}</main>
    </div>
  );
}
