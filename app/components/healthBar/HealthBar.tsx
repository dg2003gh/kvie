export default function HealthBar({
  healthStatus,
}: {
  healthStatus: string[];
}) {
  const bars = healthStatus
    .map((health, key) => (
      <div
        key={key}
        title={health}
        className={`w-4 h-5 rounded-2xl transition duration-300 hover:scale-125 ${health === "OK" ? "bg-green-300" : "bg-red-300"}`}
      ></div>
    ))
    .reverse();
  return <div className="flex gap-1 w-24">{bars}</div>;
}
