PhilGEPS step 04B — DBSCAN on PCA PC1–PC3

Inputs:
  output_source/03/Clustering/philgeps_clustering_pc_scores.csv
  output_source/02/Min-Max Scaling/philgeps_min_max_scaled.csv (theme + base columns for backtrack)
  output_source/05B/DBSCAN_Evaluation/dbscan_selection_summary.json (optional; eps / min_samples)

Parameters (this run):
  eps = 0.022541477139097522; min_samples = 20; metric = euclidean
  Source for defaults: step_05b_summary

Process:
  sklearn.cluster.DBSCAN on the full PC matrix (n=487,605). Noise remains cluster_id = -1.
  Row order matches step 03 (RangeIndex = row_index).

Outputs:
  output_source/04B/DBSCAN/philgeps_dbscan_assignments.csv
      row_index, cluster_id, is_noise, PC1, PC2, PC3
  output_source/04B/Backtrack/philgeps_dbscan_backtrack.csv
      row_index, cluster_id, is_noise, PC1..PC3, POLICY_THEME_SCORE_COLUMNS, POLICY_PCA_BASE_COLUMNS (if present in scaled CSV)
  output_source/04B/per_cluster/dbscan_cluster_<id>.csv — dense clusters only
  output_source/04B/per_cluster/dbscan_noise.csv — noise (-1)
  results/04B/Summaries/dbscan_cluster_counts.json
  results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_numeric.png

Next:
  python 06b_dbscan_interpretation_philgeps.py  (semantic PCA PNG + theme profiles)
