export type ImageManifestItem = {
  src: string
  title: string
  /** Optional narrative shown next to the figure (e.g. carousel interpretation). */
  explanation?: string
  /** Optional short label above the interpretation body in carousels (overrides default heading). */
  interpretationHeading?: string
}

const mergedMissingnessExplanation =
  'This chart shows that all columns in the cleaned PhilGEPS medical procurement dataset have 0 percent missing values. The cleaning process produced a complete dataset with 487,605 records, making it ready for preprocessing, feature engineering, and clustering.'

const mergedDtypeOverviewExplanation = `Most columns in the cleaned PhilGEPS dataset are text or categorical fields. This is expected because procurement records include descriptions, locations, agencies, statuses, and supplier details.

Since clustering requires numeric inputs, the next step converts selected categorical, date, and numeric fields into machine-learning-ready features.`

const mergedNumericCorrelationExplanation = `This heatmap shows how the cleaned numeric fields relate to each other. The strongest relationship is between Item Budget and Contract Amount with a correlation of 0.91, meaning higher planned item budgets usually correspond to higher awarded contract amounts.

Most other numeric fields have weak relationships, so additional feature engineering, scaling, and PCA were needed before clustering.`

const mergedCategoricalAssociationExplanation = `This heatmap shows how selected categorical fields are related using Cramer's V. The strongest relationship is between organization type and grouped organization type, which is expected because they describe similar information.

Most other categorical fields show weak to moderate association, meaning they provide different procurement context. This helped guide which categorical variables could be encoded during preprocessing.`

const mergedCleanedRecordsByYearExplanation = `This chart shows how many cleaned medical procurement records were available per year. The highest counts appear in 2023 and 2024, while 2020 and 2021 have fewer records.

The lower count in 2025 should be interpreted carefully because the available 2025 data may not cover the full year.`

const mergedRawVsCleanedGroupedExplanation = `This chart compares all loaded PhilGEPS records with the final cleaned medical procurement records. The cleaned dataset is smaller because the process filtered out non-medical procurement records.

After Step 01, the dataset was reduced to 487,605 medical-related records, making it focused and ready for preprocessing and clustering.`

const mergedKeptVsRemovedExplanation = `This chart shows how the raw PhilGEPS records were reduced into the final cleaned medical dataset. The blue section shows records kept for analysis, while the gray section shows records removed because they were non-medical, duplicated, or not included in the final output.

The final dataset is smaller, but more focused on medical procurement records needed for clustering.`

const kMeansMetricRankHeatmapExplanation = `This heatmap compares K values from 2 to 7 across clustering metrics. A rank of 1 means that K performed best for that metric.

K = 6 ranked best in silhouette, Davies-Bouldin, and composite score, making it the strongest overall choice. Although K = 7 ranked best in inertia, inertia was used only as an elbow diagnostic because it usually improves as K increases.

Based on this evaluation, K = 6 was selected for the final K-means clustering model.`

const kMeansMetricCurvesExplanation = `These charts compare K values from 2 to 7 using common clustering metrics. Silhouette, Calinski-Harabasz, and composite scores are better when higher, while Davies-Bouldin is better when lower.

The results show that K = 6 gives the strongest overall performance. It has the best silhouette score, the lowest Davies-Bouldin score, and the highest composite score.

Because of this, K = 6 was selected for the final K-means model.`

const kMeansCombinedMetricsExplanation = `This chart compares the main K-means evaluation metrics on one normalized scale from 0 to 1. A higher score means better performance in the graph.

Silhouette, Calinski-Harabasz, and composite scores are normalized directly because higher values are better. Davies-Bouldin is inverted because lower values are better.

The yellow star marks the selected value: K = 6. This K performed best for silhouette, best for Davies-Bouldin after inversion, and strongest overall in the composite score.`

const kMeansEvaluationFigurePlaceholder =
  'Placeholder — Add a short interpretation: how this diagnostic supports choosing k and validating the K-means configuration on the PhilGEPS medical slice.'

const dbscanEvaluationFigurePlaceholder =
  'Placeholder — Add a short interpretation: how this DBSCAN grid diagnostic informs epsilon / minPts choices and parameter stability on the PhilGEPS medical slice.'

const kMeansInterpretationFigurePlaceholder =
  'Placeholder — Add a short interpretation: what this K-means cluster profile figure shows and how it supports narrative labels (semantic themes are post hoc guides only).'

const preprocessingNumericCorrelationExplanation = `This heatmap shows how the engineered numeric features relate to each other. Time-based features, budget-related features, and policy proxy scores show expected relationships.

Some theme scores are opposites by design, such as high-risk vs low-risk shortage and unequal vs equal supply regions. These patterns help confirm that the engineered features behave as expected before scaling and clustering.`

const preprocessingTopKGridExplanation = `This chart shows how high-cardinality fields were simplified before encoding. The most frequent categories were kept, while less common values were grouped as "Other."

Metro Manila dominates several location fields, while medical supplies, drugs, and laboratory equipment are the largest business categories. This step helped reduce feature complexity before clustering.`

const preprocessingPostScaleSummaryExplanation = `This chart shows the numeric features after min-max scaling. Scaling converts the selected numeric values into a common 0 to 1 range, so features with large original values do not dominate PCA or clustering.

The bars show the average value and spread of each scaled feature. This is a preprocessing check, not a final clustering result.`

const preprocessingPostScaleCorrelationExplanation = `This heatmap shows how the scaled numeric features relate to each other after min-max scaling. Time-based features and budget-related features show expected relationships.

The chart is a preprocessing check, not a clustering result. It helps confirm that the numeric features are ready for PCA, where related patterns are summarized before clustering.`

const preprocessingDummyCountExplanation = `This chart shows how many new columns were created from each categorical field after encoding. Larger fields such as Client Agency, Business Category, Province, Area of Delivery, Procurement Mode, and UOM produced more encoded columns.

To avoid creating too many sparse features, high-cardinality fields were grouped or frequency-encoded before clustering. This made categorical data usable while keeping the dataset manageable.`

const preprocessingTopDummiesExplanation = `This chart shows the most common one-hot encoded categories in the cleaned medical procurement dataset. Many records are government-funded, goods-based, locally awarded, and linked to Philippine awardees.

The most frequent encoded patterns also show strong NCR or Metro Manila presence, common public bidding and small value procurement modes, and major medical categories such as medical supplies, drugs, and laboratory equipment.`

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
        interpretationHeading: 'Missing Values After Cleaning',
        explanation: mergedMissingnessExplanation,
      },
      {
        src: `${mergedBase}/02_overview_dtype_counts.png`,
        title: 'Dtype counts overview',
        interpretationHeading: 'Column Data Types',
        explanation: mergedDtypeOverviewExplanation,
      },
      {
        src: `${mergedBase}/04_correlation_numeric.png`,
        title: 'Numeric correlation',
        interpretationHeading: 'Numeric Correlation',
        explanation: mergedNumericCorrelationExplanation,
      },
      {
        src: `${mergedBase}/05_correlation_categorical_cramers_v.png`,
        title: 'Categorical Cramer’s V correlation',
        interpretationHeading: 'Categorical Association',
        explanation: mergedCategoricalAssociationExplanation,
      },
      {
        src: `${mergedBase}/06_rows_by_year_cleaned_medical.png`,
        title: 'Rows by year — cleaned medical',
        interpretationHeading: 'Cleaned Records by Year',
        explanation: mergedCleanedRecordsByYearExplanation,
      },
      {
        src: `${mergedBase}/07_raw_vs_cleaned_rows_by_year_grouped.png`,
        title: 'Raw vs cleaned rows by year (grouped)',
        interpretationHeading: 'Raw vs Cleaned Records',
        explanation: mergedRawVsCleanedGroupedExplanation,
      },
      {
        src: `${mergedBase}/08_raw_vs_cleaned_stacked_by_year.png`,
        title: 'Raw vs cleaned stacked by year',
        interpretationHeading: 'Kept vs Removed Records',
        explanation: mergedKeptVsRemovedExplanation,
      },
    ],
    /** Ordered slides for the Data Understanding K-means evaluation carousel (distinct from `evaluation.kmeans` gallery order). */
    kmeansEvaluationCarousel: [
      {
        src: '/results/05/EDA/metric_rank_heatmap.png',
        title: 'Metric rank heatmap (k-means search)',
        interpretationHeading: 'K-means Metric Ranking',
        explanation: kMeansMetricRankHeatmapExplanation,
      },
      {
        src: '/results/05/KSelection/silhouette_vs_k.png',
        title: 'Silhouette vs k',
        interpretationHeading: 'K-means Metric Curves',
        explanation: kMeansMetricCurvesExplanation,
      },
      {
        src: '/results/05/KSelection/davies_bouldin_vs_k.png',
        title: 'Davies–Bouldin vs k',
        interpretationHeading: 'K-means Metric Curves',
        explanation: kMeansMetricCurvesExplanation,
      },
      {
        src: '/results/05/KSelection/calinski_harabasz_vs_k.png',
        title: 'Calinski–Harabasz vs k',
        interpretationHeading: 'K-means Metric Curves',
        explanation: kMeansMetricCurvesExplanation,
      },
      {
        src: '/results/05/KSelection/composite_vs_k.png',
        title: 'Composite score vs k',
        interpretationHeading: 'K-means Metric Curves',
        explanation: kMeansMetricCurvesExplanation,
      },
      {
        src: '/results/05/KSelection/combined_silhouette_db_ch_composite_vs_k.png',
        title: 'Combined silhouette, DB, CH, and composite vs k',
        interpretationHeading: 'Combined K-selection Metrics',
        explanation: kMeansCombinedMetricsExplanation,
      },
    ],
    /** Ordered slides for the Data Understanding DBSCAN evaluation carousel (distinct from `evaluation.dbscan` gallery order). */
    dbscanEvaluationCarousel: [
      {
        src: '/results/05B/EDA/metric_rank_heatmap.png',
        title: 'DBSCAN metric rank heatmap',
        explanation: dbscanEvaluationFigurePlaceholder,
      },
      {
        src: '/results/05B/EDA/dbscan_cluster_sizes_best_params.png',
        title: 'Cluster sizes at best parameters',
        explanation: dbscanEvaluationFigurePlaceholder,
      },
      {
        src: '/results/05B/DBSCAN_Evaluation/dbscan_noise_share_heatmap.png',
        title: 'Noise share heatmap',
        explanation: dbscanEvaluationFigurePlaceholder,
      },
      {
        src: '/results/05B/DBSCAN_Evaluation/dbscan_silhouette_heatmap.png',
        title: 'Silhouette heatmap',
        explanation: dbscanEvaluationFigurePlaceholder,
      },
      {
        src: '/results/05B/DBSCAN_Evaluation/dbscan_davies_bouldin_heatmap.png',
        title: 'Davies–Bouldin heatmap',
        explanation: dbscanEvaluationFigurePlaceholder,
      },
      {
        src: '/results/05B/DBSCAN_Evaluation/dbscan_n_clusters_heatmap.png',
        title: 'Cluster-count heatmap',
        explanation: dbscanEvaluationFigurePlaceholder,
      },
      {
        src: '/results/05B/DBSCAN_Evaluation/dbscan_composite_heatmap.png',
        title: 'Composite DBSCAN heatmap',
        explanation: dbscanEvaluationFigurePlaceholder,
      },
    ],
    /** K-means cluster interpretation preview figures (Data Understanding §06A). */
    kmeansInterpretationCarousel: [
      {
        src: '/results/06/Cluster_Interpretation/EDA/cluster_size_bar.png',
        title: 'Cluster size distribution',
        explanation: kMeansInterpretationFigurePlaceholder,
      },
      {
        src: '/results/06/Cluster_Interpretation/EDA/base_means_heatmap.png',
        title: 'Base feature means by cluster',
        explanation: kMeansInterpretationFigurePlaceholder,
      },
      {
        src: '/results/06/Cluster_Interpretation/EDA/theme_means_heatmap.png',
        title: 'Theme score means by cluster',
        explanation: kMeansInterpretationFigurePlaceholder,
      },
      {
        src: '/results/06/Cluster_Interpretation/EDA/theme_z_heatmap.png',
        title: 'Theme z-scores by cluster',
        explanation: kMeansInterpretationFigurePlaceholder,
      },
    ],
    /**
     * Data Understanding §02 — feature selection, min–max scaling, and one-hot encoding, in pipeline order.
     */
    preprocessingCarousel: [
      {
        src: '/results/02/Feature Selection/04_numeric_correlation.png',
        title: 'Numeric correlation (step 02)',
        interpretationHeading: 'Layer A Numeric Correlation',
        explanation: preprocessingNumericCorrelationExplanation,
      },
      {
        src: '/results/02/Feature Selection/07_topk_grid.png',
        title: 'Top‑K feature grid',
        interpretationHeading: 'Top-K Category Grouping',
        explanation: preprocessingTopKGridExplanation,
      },
      {
        src: '/results/02/Min-Max Scaling/03_post_scale_summary.png',
        title: 'Post‑scaling summary',
        interpretationHeading: 'Scaled Numeric Features',
        explanation: preprocessingPostScaleSummaryExplanation,
      },
      {
        src: '/results/02/Min-Max Scaling/04_post_scale_correlation.png',
        title: 'Post‑scaling correlation',
        interpretationHeading: 'Post-Scale Numeric Correlation',
        explanation: preprocessingPostScaleCorrelationExplanation,
      },
      {
        src: '/results/02/One-Hot Encoding/01_dummy_count_per_source.png',
        title: 'Dummy column counts by source',
        interpretationHeading: 'One-Hot Encoding Output',
        explanation: preprocessingDummyCountExplanation,
      },
      {
        src: '/results/02/One-Hot Encoding/04_top_dummies_by_rate.png',
        title: 'Top dummy levels by prevalence',
        interpretationHeading: 'Top Encoded Categories',
        explanation: preprocessingTopDummiesExplanation,
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
        src: '/results/03/Clustering/pca_loadings_pc123.png',
        title: 'PCA Feature Loadings',
      },
      {
        src: '/results/03/Clustering/cumulative_variance_pca.png',
        title: 'PCA Explained Variance',
      },
      {
        src: '/results/03/Clustering/pca_space_pc123_3d.png',
        title: 'PCA 3D Scatter',
      },
    ],
    kmeans: [
      {
        src: '/results/04/PCA_Cluster/pca_space_pc123_3d_kmeans_numeric.png',
        title: 'K-means PCA Cluster Plot',
      },
    ],
    dbscan: [
      {
        src: '/results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_numeric.png',
        title: 'DBSCAN PCA',
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
  dbscanMetricsGrid: '/data/05B/DBSCAN_Evaluation/dbscan_metrics_grid.csv',
  featureSelected: '/data/02/Feature Selection/philgeps_features_selected.csv',
  minMaxScaled: '/data/02/Min-Max Scaling/philgeps_min_max_scaled.csv',
  clusterThemeProfiles: '/results/06/Interpretation/cluster_theme_profiles.csv',
  clusterSemanticMap: '/results/06/Interpretation/cluster_semantic_map.csv',
  dbscanThemeProfiles: '/results/06B/Interpretation/dbscan_cluster_theme_profiles.csv',
  dbscanSemanticMap: '/results/06B/Interpretation/dbscan_cluster_semantic_map.csv',
  modelComparisonSummary: '/data/07/Model_Comparison/kmeans_vs_dbscan_summary.csv',
} as const
