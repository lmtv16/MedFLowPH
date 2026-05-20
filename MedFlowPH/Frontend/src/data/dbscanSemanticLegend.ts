/**
 * Grouped DBSCAN semantic legend — matches
 * `results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_semantic.png` and
 * `pca_space_pc123_3d_dbscan_interactive.html` (noise, top 5 by count, other).
 */
export type DbscanLegendMarker = 'x' | 'circle' | 'dot'

export type DbscanSemanticLegendEntry = {
  label: string
  color: string
  marker: DbscanLegendMarker
}

/** tab20 @ (clusterId % 20) / 20 + 0.001 — same rule as philgeps_dbscan_common. */
export const DBSCAN_SEMANTIC_LEGEND_ENTRIES: DbscanSemanticLegendEntry[] = [
  { label: 'Noise / outliers', color: 'rgb(199, 199, 199)', marker: 'x' },
  { label: 'C25: Mixed procurement profile', color: 'rgb(152, 223, 138)', marker: 'circle' },
  { label: 'C0: Moderate understocking', color: 'rgb(31, 119, 180)', marker: 'circle' },
  { label: 'C26: High shortage-risk', color: 'rgb(214, 39, 40)', marker: 'circle' },
  { label: 'C119: High shortage-risk', color: 'rgb(158, 218, 229)', marker: 'circle' },
  { label: 'C27: Strong understocking / lean-stock', color: 'rgb(255, 152, 150)', marker: 'circle' },
  { label: 'Other DBSCAN clusters', color: 'rgb(140, 173, 209)', marker: 'dot' },
]
