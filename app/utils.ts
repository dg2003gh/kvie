export function formatKibToGib(kib: number, decimals = 2): string {
  const gib = kib / (1024 ** 2);
  return `${gib.toFixed(decimals)} GiB`;
}
