export const tooltipFormatter = (
  value: unknown,
  name: unknown
): [string, string] => {
  return [
    typeof value === 'number'
      ? value.toFixed(3)
      : String(value ?? ''),
    name === 'silhouette'
      ? 'Silhouette'
      : String(name ?? ''),
  ];
};
