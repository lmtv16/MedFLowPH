PhilGEPS step 05B — DBSCAN parameter evaluation (PCA PC1–PC3)

Inputs:
  output_source/03/Clustering/philgeps_clustering_pc_scores.csv

Process:
  DBSCAN uses ``eps`` and ``min_samples`` instead of K.
  * ``eps`` controls the neighborhood radius in the PCA space (Euclidean by default).
  * ``min_samples`` controls how many neighbors are required to form a dense core region.
  * Noise is labeled -1 and is excluded when computing silhouette, Davies–Bouldin, and
    Calinski–Harabasz so those metrics reflect only **assigned** dense clusters.

  Grid (this run): eps in [0.02, 0.03]; min_samples in [15, 20]
  Evaluation rows: 8,000 of 487,605 (deterministic subsample, seed=42), unless
  ``--metrics-on-full`` was used.

  Valid candidate rule (for primary selection):
    * at least 2 non-noise clusters
    * noise_share <= 0.40
    * largest_cluster_share <= 0.85 (among non-noise points)

  Among valid candidates we maximize:
    composite = z_silhouette + z_calinski_harabasz - z_davies_bouldin - abs(noise_share - 0.10)
  (z-scores are taken across the grid for each metric.)

  If no row passes validity, a fallback pick prefers >=2 clusters with the lowest noise_share.

Plots:
  results/05B/DBSCAN_Evaluation/dbscan_*_heatmap.png — eps × min_samples surfaces
  results/05B/DBSCAN_Evaluation/combined_silhouette_db_ch_composite_vs_grid.png — silhouette, DB (inv.), CH, composite on [0,1] (★ = chosen grid point)
  results/05B/EDA/metric_rank_heatmap.png — rank of each (ε, min_samples) row per metric
  results/05B/EDA/dbscan_cluster_sizes_best_params.png — sizes for the chosen parameters on the eval subsample

Notes:
  DBSCAN identifies density-based groups and outlier procurement records; it may underperform
  K-means on this dataset if the PCA space does not show sharp density separation.
  Metrics on the subsample are reproducible estimates; use ``--metrics-on-full`` only if you
  accept long runtimes on large n.
