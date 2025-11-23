import { Pod, Node } from "@/app/page";
import { formatKibToGib } from "@/app/utils";
import { RiHeartPulseLine, RiServerLine } from "react-icons/ri";
import { SiKubernetes } from "react-icons/si";
import HealthBar from "../healthBar/HealthBar";
import { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import Chart from "../Charts/Charts";
import { PROXY_HOST } from "@/app/config";

export default function Monitoring({
  pods,
  nodes,
}: {
  pods: Array<Pod>;
  nodes: Array<Node>;
}) {
  const PodsTemplate = ({ pod }: { pod: Pod }) => {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
      fetch(
        `${PROXY_HOST}/pod?namespace=${pod.metadata.namespace}&pod=${pod.metadata.name}`,
      )
        .then((res) => res.json())
        .then((json) => setData(json))
        .catch((e) => console.log(e));
    }, [pod]);

    const statusColor = (): string => {
      switch (pod.status.phase) {
        case "Running":
          return "bg-green-200 text-green-800";
        case "Pending":
          return "bg-orange-200 text-orange-800";
        case "Succeeded":
          return "bg-blue-200 text-blue-800";
        default:
          return "bg-red-200 text-red-800";
      }
    };

    return (
      <>
        <li
          onClick={() => setOpen(true)}
          key={pod.metadata.name}
          className="p-3 flex justify-between"
        >
          <span className="flex items-center gap-2 cursor-pointer">
            <span
              className="flex items-center gap-2 w-64"
              title={pod.metadata.name}
            >
              <SiKubernetes className="text-2xl" />{" "}
              {pod.metadata.name.length > 20
                ? pod.metadata.name.slice(0, 20).concat("...")
                : pod.metadata.name}
            </span>
            {data != null ? (
              <HealthBar
                healthStatus={data
                  .filter((pod, index) => index <= 10)
                  .map((pod) => pod.message)}
              />
            ) : null}
          </span>
          <span className={`px-2 py-1 text-xs rounded ${statusColor()}`}>
            {pod.status.phase}
          </span>
        </li>
        <Modal
          className="w-full h-3/4 mx-10 overflow-y-scroll bg-zinc-800"
          isOpen={open}
          onClose={() => setOpen(false)}
        >
          <h1 className="flex justify-between text-4xl font-bold mb-10">
            <span className="flex items-center gap-2">
              <SiKubernetes className="text-2xl" /> {pod.metadata.name}
            </span>
            <span className={`px-2 py-1 text-center rounded ${statusColor()}`}>
              {pod.status.phase}
            </span>
          </h1>
          <h2 className="text-xl font-semibold mb-2 text-slate-300">
            Status response
          </h2>
          {data != null ? (
            <Chart
              data={data
                .map((pod) => ({
                  name: new Date(pod.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  value: pod.status,
                }))
                .reverse()}
            />
          ) : null}

          <h2 className="text-xl font-semibold mb-2 text-slate-300">History</h2>
          <div className="overflow-auto max-h-80 rounded-lg border border-zinc-800">
            <table className="min-w-full text-sm text-left text-slate-300">
              <thead className="bg-zinc-900 text-slate-400 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Message</th>
                  <th className="px-4 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data != null &&
                  data.map((pod, key) => (
                    <tr
                      key={key}
                      className="border-b border-zinc-800 hover:bg-zinc-800/50 transition"
                    >
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            pod.status === 1
                              ? "bg-green-600/20 text-green-400"
                              : "bg-red-600/20 text-red-400"
                          }`}
                        >
                          {pod.status === 1 ? "OK" : "ERROR"}
                        </span>
                      </td>
                      <td className="px-4 py-2">{pod.message}</td>
                      <td className="px-4 py-2">
                        {new Date(pod.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <h2 className="text-xl font-semibold mt-8 mb-2 text-slate-300">
            Containers
          </h2>
          <div className="overflow-auto max-h-60 rounded-lg border border-zinc-800">
            <table className="min-w-full text-sm text-left text-slate-300">
              <thead className="bg-zinc-900 text-slate-400 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-2">Container</th>
                  <th className="px-4 py-2">Image</th>
                  <th className="px-4 py-2">State</th>
                  <th className="px-4 py-2">Restarts</th>
                  <th className="px-4 py-2">Reason</th>
                  <th className="px-4 py-2">CPU</th>
                  <th className="px-4 py-2">Memory</th>
                </tr>
              </thead>
              <tbody>
                {pod.spec.containers.map((c, index) => {
                  const status = pod.status.containerStatuses?.[index];
                  const state = status?.state
                    ? Object.keys(status.state)[0]
                    : "Unknown";
                  const details =
                    status?.state?.waiting?.reason ||
                    status?.state?.terminated?.reason ||
                    "-";

                  return (
                    <tr
                      key={c.name}
                      className="border-b border-zinc-800 hover:bg-zinc-800/50 transition"
                    >
                      <td className="px-4 py-2">{c.name}</td>
                      <td className="px-4 py-2 truncate max-w-xs">{c.image}</td>

                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            state === "running"
                              ? "bg-green-600/20 text-green-400"
                              : state === "waiting"
                                ? "bg-yellow-600/20 text-yellow-400"
                                : "bg-red-600/20 text-red-400"
                          }`}
                        >
                          {state.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-4 py-2">{status?.restartCount ?? 0}</td>
                      <td className="px-4 py-2">{details}</td>
                      <td className="px-4 py-2">
                        {c.resources?.requests?.cpu ||
                          c.resources?.limits?.cpu ||
                          "-"}
                      </td>
                      <td className="px-4 py-2">
                        {c.resources?.requests?.memory ||
                          c.resources?.limits?.memory ||
                          "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Modal>
      </>
    );
  };

  const NodesTemplate = ({ node }: { node: Node }) => {
    const [data, setData] = useState<any[]>([]);
    const [open, setOpen] = useState(false);

    const nodeStatus =
      node.status.conditions[3].status.toLowerCase() === "true"
        ? "Ready"
        : "Not Ready";

    useEffect(() => {
      fetch(`${PROXY_HOST}/node?node=${node.metadata.name}`)
        .then((res) => res.json())
        .then((json) => setData(json))
        .catch((e) => console.log(e));
    }, [node]);

    const statusColor = () =>
      nodeStatus === "Ready"
        ? "bg-green-200 text-green-800"
        : "bg-red-200 text-red-800";

    return (
      <>
        <li
          onClick={() => setOpen(true)}
          key={node.metadata.name}
          className="p-3 flex justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span
              className="flex items-center gap-2 w-64"
              title={node.metadata.name}
            >
              <RiServerLine className="text-2xl" />
              {node.metadata.name.length > 20
                ? node.metadata.name.slice(0, 20).concat("...")
                : node.metadata.name}
            </span>
            {data != null ? (
              <HealthBar
                healthStatus={data
                  .filter((n, index) => index <= 10)
                  .map((n) => n.message)}
              />
            ) : null}
          </span>
          <span className={`px-2 py-1 text-xs rounded ${statusColor()}`}>
            {nodeStatus}
          </span>
        </li>

        <Modal
          className="w-full h-3/4 mx-10 overflow-y-scroll bg-zinc-800"
          isOpen={open}
          onClose={() => setOpen(false)}
        >
          <h1 className="flex justify-between text-4xl font-bold mb-10">
            <span className="flex items-center gap-2">
              <RiServerLine /> {node.metadata.name}
            </span>
            <span className={`px-2 py-1 text-center rounded ${statusColor()}`}>
              {nodeStatus}
            </span>
          </h1>

          <h2 className="text-xl font-semibold mb-2 text-slate-300">
            Status response
          </h2>
          {data != null ? (
            <Chart
              data={data
                .map((n) => ({
                  name: new Date(n.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  value: n.status,
                }))
                .reverse()}
            />
          ) : null}

          <h2 className="text-xl font-semibold mb-2 text-slate-300">History</h2>
          <div className="overflow-auto max-h-80 rounded-lg border border-zinc-800">
            <table className="min-w-full text-sm text-left text-slate-300">
              <thead className="bg-zinc-900 text-slate-400 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Message</th>
                  <th className="px-4 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.map((n, key) => (
                  <tr
                    key={key}
                    className="border-b border-zinc-800 hover:bg-zinc-800/50 transition"
                  >
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          n.status === 1
                            ? "bg-green-600/20 text-green-400"
                            : "bg-red-600/20 text-red-400"
                        }`}
                      >
                        {n.status === 1 ? "OK" : "ERROR"}
                      </span>
                    </td>
                    <td className="px-4 py-2">{n.message}</td>
                    <td className="px-4 py-2">
                      {new Date(n.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2 className="text-xl font-semibold mt-8 mb-2 text-slate-300">
            Node Details
          </h2>
          <div className="overflow-auto max-h-60 rounded-lg border border-zinc-800">
            <table className="min-w-full text-sm text-left text-slate-300">
              <thead className="bg-zinc-900 text-slate-400 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-2">Metric</th>
                  <th className="px-4 py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-800 hover:bg-zinc-800/50 transition">
                  <td className="px-4 py-2">Pods Capacity</td>
                  <td className="px-4 py-2">{node.status.capacity.pods}</td>
                </tr>
                <tr className="border-b border-zinc-800 hover:bg-zinc-800/50 transition">
                  <td className="px-4 py-2">CPU</td>
                  <td className="px-4 py-2">{node.status.capacity.cpu}</td>
                </tr>
                <tr className="border-b border-zinc-800 hover:bg-zinc-800/50 transition">
                  <td className="px-4 py-2">Memory</td>
                  <td className="px-4 py-2">
                    {formatKibToGib(
                      Number(node.status.capacity.memory.slice(0, -2)),
                    )}
                  </td>
                </tr>
                <tr className="border-b border-zinc-800 hover:bg-zinc-800/50 transition">
                  <td className="px-4 py-2">Ephemeral Storage</td>
                  <td className="px-4 py-2">
                    {formatKibToGib(
                      Number(
                        node.status.capacity["ephemeral-storage"].slice(0, -2),
                      ),
                    )}
                  </td>
                </tr>
                {node.status.conditions.map((cond, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-zinc-800 hover:bg-zinc-800/50 transition"
                  >
                    <td className="px-4 py-2">{cond.type}</td>
                    <td
                      className={`px-4 py-2 rounded text-xs ${
                        cond.status.toLowerCase() === "true"
                          ? "bg-green-600/20 text-green-400"
                          : "bg-red-600/20 text-red-400"
                      }`}
                    >
                      {cond.status.toLowerCase() === "true" ? "True" : "False"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      </>
    );
  };

  return (
    <section className="flex flex-col h-screen w-full p-5 bg-zinc-900 text-white overflow-y-scroll gap-5">
      <h1 className="flex gap-3 text-4xl font-bold">
        <RiHeartPulseLine />
        Monitoring
      </h1>
      {/* <Filters /> */}
      <div className="h-fit">
        <h2 className="text-xl font-semibold mb-2 text-slate-300">Nodes</h2>
        <ul className="bg-zinc-950 overflow-scroll rounded-lg shadow divide-y">
          {nodes.map((n, k) => (
            <NodesTemplate node={n} key={k} />
          ))}
        </ul>
      </div>
      <div className="">
        <h2 className="text-xl font-semibold text-slate-300">System Pods</h2>
        <ul className="bg-zinc-950 h-96 rounded-lg shadow divide-y overflow-y-scroll">
          {pods
            .filter((p) => p.metadata.namespace == "kube-system")
            .map((p, key) => (
              <PodsTemplate key={key} pod={p} />
            ))}
        </ul>
      </div>
      <div className="">
        <h2 className="text-xl font-semibold mb-2 text-slate-300">
          {" "}
          User Pods
        </h2>
        <ul className="bg-zinc-950 h-96 rounded-lg shadow divide-y overflow-y-scroll">
          {pods
            .filter((p) => p.metadata.namespace != "kube-system")
            .map((p, key) => (
              <PodsTemplate key={key} pod={p} />
            ))}
        </ul>
      </div>
    </section>
  );
}
