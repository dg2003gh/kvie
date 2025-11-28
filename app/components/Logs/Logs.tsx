import { PROXY_HOST } from "@/app/config";
import { Pod } from "@/app/types";
import { useEffect, useRef, useState } from "react";
import {
  RiBox1Line,
  RiCalendar2Line,
  RiLoopLeftLine,
  RiNewspaperLine,
  RiRestartLine,
  RiSettings2Line,
  RiTimeLine,
} from "react-icons/ri";
import Filters, { Selects } from "../Filters/filters";
import Highlight from "../HighLight/hightlight";

export default function Logs({ pods }: { pods: Array<Pod> }) {
  const [log, setLog] = useState("");
  const [search, setSearch] = useState("");
  const [follow, setFollow] = useState(true);
  const [timestamps, setTimestamps] = useState(true);
  const [period, setPeriod] = useState<string>("any");
  const [prefix, setPrefix] = useState(false);
  const currentPod = useRef<Pod>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = (pod: Pod, container?: string) => {
    setLog("");
    currentPod.current = pod;

    if (!pod) return;

    const controller = new AbortController();
    const url = `${PROXY_HOST}/api/v1/namespaces/${pod.metadata.namespace}/pods/${pod.metadata.name}/log?follow=${follow}&timestamps=${timestamps}${period == "any" ? "" : "&sinceSeconds=" + period}&prefix=${prefix}${container ? `&container=${container}` : ""}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.body) throw new Error("No stream body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setLog((prev) => prev + chunk);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError")
          console.error("Error fetching logs:", err);
      });

    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    return () => controller.abort();
  };

  useEffect(() => {
    if (currentPod.current) fetchLogs(currentPod.current);
  }, [follow, timestamps, period]);

  const noLog = (
    <p className="flex flex-col items-center justify-center text-3xl text-center gap-5 h-full">
      Select a pod to get its logs.
      <RiNewspaperLine className="animate-pulse text-7xl" />
    </p>
  );

  const waitingLog = (
    <p className="flex flex-col items-center justify-center text-3xl text-center gap-5 h-full">
      Waiting for logs...
      <RiLoopLeftLine className="animate-spin text-7xl" />
    </p>
  );

  const multipleContainersLog = (
    <p className="flex flex-col items-center justify-center text-3xl text-center gap-5 h-full">
      Choose a container in container dropdown.
      <RiBox1Line className="animate-bounce text-7xl" />
    </p>
  );

  const ShowLog = () => {
    if (log == "chooseContainer") return multipleContainersLog;
    else if (!log && period == "any") return noLog;
    else if (period != "any" && !log) return waitingLog;
    else if (log) return <Highlight text={log} />;
  };

  const selects: Array<Selects> = [
    {
      name: "pod",
      call: fetchLogs,
      icon: <RiNewspaperLine />,
      options: pods,
    },
    {
      name: "period",
      icon: <RiTimeLine />,
      call: setPeriod,
      options: ["any", "1", "5", "10", "15", "30", "60", "120", "340"],
    },
    {
      name: "requestOptions",
      icon: <RiSettings2Line />,
      checkbox: true,
      options: [
        {
          name: "Follow",
          call: setFollow,
          state: follow,
        },
        {
          name: "timestamps",
          call: setTimestamps,
          state: timestamps,
        },

        {
          name: "Show prefix",
          call: setPrefix,
          state: prefix,
        },
      ],
    },
  ];

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const refresh = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ): void => {
    const target = event.currentTarget;
    if (currentPod.current) fetchLogs(currentPod.current);
    target.disabled = true;

    setTimeout(() => (target.disabled = false), 1000);
  };

  return (
    <section className="flex flex-col gap-5 w-full h-full p-5  bg-zinc-900">
      <h1 className="flex gap-5 items-center text-white text-3xl font-bold">
        <RiNewspaperLine />
        Logging
      </h1>
      <Filters setLog={setLog} selects={selects} setSearch={setSearch}>
        <>
          <li className="flex items-center justify-center">
            <button
              disabled={!currentPod.current || follow}
              onClick={refresh}
              className="cursor-pointer disabled:bg-gray-400 disabled:text-gray-500 rounded-xl border-1 border-slate-800 bg-zinc-900 w-full h-full p-2"
              title={"Reload Logs" + currentPod ? "" : " - Disabled"}
            >
              <RiRestartLine />
            </button>
          </li>
          {/* <li className="flex items-center justify-center"> */}
          {/*   <button className="relative text-center cursor-pointer rounded-xl border-1 border-slate-800 bg-zinc-900 w-full h-full p-2"> */}
          {/*     <RiCalendar2Line className="" /> */}
          {/*   </button> */}
          {/* </li> */}
        </>
      </Filters>
      <pre className="w-[85vw] text-white overflow-scroll h-[90%] bg-zinc-950 rounded-2xl p-5 whitespace-pre-wrap">
        <ShowLog />
        <div ref={logEndRef} />
      </pre>
    </section>
  );
}
