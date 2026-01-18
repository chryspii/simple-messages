type TagProps = {
  label: string;
  status?: "healthy" | "unhealthy" | "unknown";
};

export function HealthTag({ label, status = "unknown" }: TagProps) {
  let color = "bg-gray-300 text-gray-800";

  if (status === "healthy") color = "bg-green-500 text-white";
  if (status === "unhealthy") color = "bg-red-500 text-white";

  return (
    <span className={`px-3 py-1 rounded text-sm font-semibold ${color}`}>
      {label}
    </span>
  );
}
