export type ImageManifestItem = {
  src: string
  title: string
}

const mergedBase =
  '/results/01/Exploratory Data Analysis/merged'

function quarterImages(year: number, quarter: number): ImageManifestItem[] {
  const q = `Q${quarter}`
  const base = `/results/00/Exploratory Data Analysis/${year}/${q}`
  return [
    {
      src: `${base}/00_overview_null_counts.png`,
      title: 'Null counts overview',
    },
    {
      src: `${base}/01_overview_dtype_counts.png`,
      title: 'Dtype counts overview',
    },
    {
      src: `${base}/02_row_counts_per_file.png`,
      title: 'Row counts per file',
    },
  ]
}

function buildByQuarter(): Record<string, ImageManifestItem[]> {
  const m: Record<string, ImageManifestItem[]> = {}
  const add = (y: number, q: number) => {
    m[`${y}-Q${q}`] = quarterImages(y, q)
  }

  add(2020, 2)
  add(2020, 3)
  add(2020, 4)
  for (let y = 2021; y <= 2024; y++) {
    add(y, 1)
    add(y, 2)
    add(y, 3)
    add(y, 4)
  }
  add(2025, 1)
  add(2025, 2)
  add(2025, 3)
  return m
}

/** Human-readable captions derived from filenames (merged EDA, etc.). */
export function filenameToTitle(filename: string): string {
  const base = filename.replace(/^\d+_/, '').replace(/\.png$/i, '')
  return base
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export const IMAGES = {
  eda: {
    merged: [
      {
        src: `${mergedBase}/01_overview_missingness_pct.png`,
        title: 'Missingness Overview',
      },
      {
        src: `${mergedBase}/02_overview_dtype_counts.png`,
        title: 'Dtype counts overview',
      },
      {
        src: `${mergedBase}/04_correlation_numeric.png`,
        title: 'Numeric correlation',
      },
      {
        src: `${mergedBase}/05_correlation_categorical_cramers_v.png`,
        title: 'Categorical Cramer’s V correlation',
      },
      {
        src: `${mergedBase}/06_rows_by_year_cleaned_medical.png`,
        title: 'Rows by year — cleaned medical',
      },
      {
        src: `${mergedBase}/07_raw_vs_cleaned_rows_by_year_grouped.png`,
        title: 'Raw vs cleaned rows by year (grouped)',
      },
      {
        src: `${mergedBase}/08_raw_vs_cleaned_stacked_by_year.png`,
        title: 'Raw vs cleaned stacked by year',
      },
    ],
    /** Keys like `2020-Q2` through `2025-Q3` per thesis window. */
    byQuarter: buildByQuarter(),
  },
  preprocessing: {
    featureSelection: [
      {
        src: '/results/02/Feature Selection/04_numeric_correlation.png',
        title: 'Numeric correlation (feature selection)',
      },
      {
        src: '/results/02/Feature Selection/07_topk_grid.png',
        title: 'Top‑K feature grid',
      },
    ],
    scaling: [
      {
        src: '/results/02/Min-Max Scaling/03_post_scale_summary.png',
        title: 'Post‑scale summary',
      },
      {
        src: '/results/02/Min-Max Scaling/04_post_scale_correlation.png',
        title: 'Post‑scale correlation',
      },
    ],
    oneHot: [
      {
        src: '/results/02/One-Hot Encoding/01_dummy_count_per_source.png',
        title: 'Dummy count per source',
      },
      {
        src: '/results/02/One-Hot Encoding/04_top_dummies_by_rate.png',
        title: 'Top dummy levels by rate',
      },
    ],
  },
  clustering: {
    pca: [
      {
        src: '/results/03/Clustering/cumulative_variance_pca.png',
        title: 'Cumulative variance (PCA)',
      },
      {
        src: '/results/03/Clustering/pca_loadings_pc123.png',
        title: 'PCA loadings PC1–3',
      },
      {
        src: '/results/03/Clustering/pca_space_pc123_3d.png',
        title: 'PCA space PC1–3 (static 3D view)',
      },
    ],
    kmeans: [
      {
        src: '/results/04/PCA_Cluster/pca_space_pc123_3d_kmeans_numeric.png',
        title: 'K‑Means PCA space — numeric colors',
      },
      {
        src: '/results/04/PCA_Cluster/pca_space_pc123_3d_kmeans_semantic.png',
        title: 'K‑Means PCA space — semantic legend',
      },
    ],
    dbscan: [
      {
        src: '/results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_numeric.png',
        title: 'DBSCAN PCA space — numeric colors',
      },
      {
        src: '/results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_semantic.png',
        title: 'DBSCAN PCA space — semantic legend',
      },
    ],
  },
  evaluation: {
    kmeans: [
      {
        src: '/results/05/KSelection/silhouette_vs_k.png',
        title: 'Silhouette vs. k',
      },
      {
        src: '/results/05/KSelection/davies_bouldin_vs_k.png',
        title: 'Davies–Bouldin vs. k',
      },
      {
        src: '/results/05/KSelection/calinski_harabasz_vs_k.png',
        title: 'Calinski–Harabasz vs. k',
      },
      {
        src: '/results/05/KSelection/composite_vs_k.png',
        title: 'Composite score vs. k',
      },
      {
        src: '/results/05/KSelection/combined_silhouette_db_ch_composite_vs_k.png',
        title: 'Combined metric curves vs. k',
      },
      {
        src: '/results/05/EDA/metric_rank_heatmap.png',
        title: 'Metric rank heatmap (K‑Means)',
      },
    ],
    dbscan: [
      {
        src: '/results/05B/DBSCAN_Evaluation/dbscan_silhouette_heatmap.png',
        title: 'DBSCAN silhouette heatmap',
      },
      {
        src: '/results/05B/DBSCAN_Evaluation/dbscan_davies_bouldin_heatmap.png',
        title: 'DBSCAN Davies–Bouldin heatmap',
      },
      {
        src: '/results/05B/DBSCAN_Evaluation/dbscan_noise_share_heatmap.png',
        title: 'DBSCAN noise share heatmap',
      },
      {
        src: '/results/05B/DBSCAN_Evaluation/dbscan_n_clusters_heatmap.png',
        title: 'DBSCAN cluster count heatmap',
      },
      {
        src: '/results/05B/DBSCAN_Evaluation/dbscan_composite_heatmap.png',
        title: 'DBSCAN composite heatmap',
      },
      {
        src: '/results/05B/EDA/dbscan_cluster_sizes_best_params.png',
        title: 'DBSCAN cluster sizes (best parameters)',
      },
      {
        src: '/results/05B/EDA/metric_rank_heatmap.png',
        title: 'Metric rank heatmap (DBSCAN)',
      },
    ],
  },
  interpretation: {
    kmeans: [
      {
        src: '/results/06/Cluster_Interpretation/EDA/base_means_heatmap.png',
        title: 'Base means heatmap',
      },
      {
        src: '/results/06/Cluster_Interpretation/EDA/theme_means_heatmap.png',
        title: 'Theme means heatmap',
      },
      {
        src: '/results/06/Cluster_Interpretation/EDA/theme_z_heatmap.png',
        title: 'Theme z‑score heatmap',
      },
      {
        src: '/results/06/Cluster_Interpretation/EDA/cluster_size_bar.png',
        title: 'Cluster sizes',
      },
    ],
  },
  comparison: [
    {
      src: '/results/07/Model_Comparison/kmeans_vs_dbscan_metric_comparison.png',
      title: 'Metric comparison — K‑Means vs. DBSCAN',
    },
    {
      src: '/results/07/Model_Comparison/kmeans_vs_dbscan_side_by_side.png',
      title: 'Side‑by‑side overview',
    },
    {
      src: '/results/07/Model_Comparison/kmeans_vs_dbscan_cluster_count.png',
      title: 'Cluster count comparison',
    },
    {
      src: '/results/07/Model_Comparison/kmeans_vs_dbscan_noise_share.png',
      title: 'Noise share comparison',
    },
    {
      src: '/results/07/Model_Comparison/kmeans_vs_dbscan_interpretability_score.png',
      title: 'Interpretability comparison',
    },
  ],
} as const

/**
 * 3D PCA embeds. Each HTML uses `fetch()` with a **relative** `*_rows.json` URL, so the iframe
 * `src` must live in the same `/public` directory as that JSON (mirrored under `results/...`).
 */
export const INTERACTIVE = {
  pca3d: '/results/03/Clustering/pca_space_pc123_3d_interactive.html',
  kmeans3d: '/results/04/PCA_Cluster/pca_space_pc123_3d_kmeans_interactive.html',
  dbscan3d: '/results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_interactive.html',
} as const

export const DATA_PATHS = {
  philgepsCleaningSummary: '/results/01/Summaries/philgeps_cleaning_summary.txt',
  kSelectionSummary: '/data/05/KSelection/k_selection_summary.json',
  clusterCountsKmeans: '/results/04/Summaries/cluster_counts.json',
  clusterCountsDbscan: '/results/04B/Summaries/dbscan_cluster_counts.json',
  kMetricsLong: '/data/05/KSelection/k_metrics_long.csv',
  dbscanMetricsGrid: '/data/05B/DBSCAN_Evaluation/dbscan_metrics_grid.csv',
  featureSelected: '/data/02/Feature Selection/philgeps_features_selected.csv',
  minMaxScaled: '/data/02/Min-Max Scaling/philgeps_min_max_scaled.csv',
  clusterThemeProfiles: '/results/06/Interpretation/cluster_theme_profiles.csv',
  clusterSemanticMap: '/results/06/Interpretation/cluster_semantic_map.csv',
  dbscanThemeProfiles: '/results/06B/Interpretation/dbscan_cluster_theme_profiles.csv',
  dbscanSemanticMap: '/results/06B/Interpretation/dbscan_cluster_semantic_map.csv',
  modelComparisonSummary: '/data/07/Model_Comparison/kmeans_vs_dbscan_summary.csv',
} as const
