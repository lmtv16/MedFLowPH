PhilGEPS step 07 — K-Means vs DBSCAN model comparison (website-ready summary)

Both models consume the same PCA-transformed coordinates from step 03 (PC1–PC3).
This step only reads prior outputs; it does not modify assignments or refit models.

K-Means (steps 04–06):
  * Every procurement record is assigned to one of K clusters (no noise label).
  * Metrics in the plots for K-Means come from the step 05 evaluation subsample for the chosen K
    (same CSV row as ``k_selection_summary.json``).

DBSCAN (steps 04B–06B):
  * Density-reachable points form clusters; others receive label -1 (noise / outliers in PCA space).
  * Internal metrics (silhouette, Davies–Bouldin, Calinski–Harabasz) exclude noise points by construction
    on the evaluation subsample.
  * The comparison table uses the **selected** row from ``dbscan_metrics_grid.csv`` when it matches
    ``chosen_eps`` / ``chosen_min_samples`` from ``dbscan_selection_summary.json``.
  * Cluster counts and noise_share in the summary CSV reflect **full-data** ``dbscan_cluster_counts.json``.

Interpretation notes:
  * DBSCAN often produces many micro-clusters on large procurement panels; presentation plots may group
    minor clusters for readability.
  * Metrics alone do not decide ``final`` storytelling quality—human review of semantic maps and theme
    profiles (steps 06 / 06B) matters.

Final conclusion:
  K-Means is more suitable as the final interpretable clustering model. DBSCAN is retained as a supporting comparison for noise and outlier-like procurement records.

Files written:
  C:\Users\loper\Desktop\version_6\MedFlowPH\output_source\07\Model_Comparison\kmeans_vs_dbscan_summary.csv
  C:\Users\loper\Desktop\version_6\MedFlowPH\results\07\Model_Comparison\kmeans_vs_dbscan_metric_comparison.png
  C:\Users\loper\Desktop\version_6\MedFlowPH\results\07\Model_Comparison\kmeans_vs_dbscan_cluster_count.png
  C:\Users\loper\Desktop\version_6\MedFlowPH\results\07\Model_Comparison\kmeans_vs_dbscan_noise_share.png
  C:\Users\loper\Desktop\version_6\MedFlowPH\results\07\Model_Comparison\kmeans_vs_dbscan_interpretability_score.png
  C:\Users\loper\Desktop\version_6\MedFlowPH\results\07\Model_Comparison\kmeans_vs_dbscan_comparison_readme.txt
  C:\Users\loper\Desktop\version_6\MedFlowPH\results\07\Model_Comparison\kmeans_vs_dbscan_side_by_side.png

Primary inputs:
  K-Means: C:\Users\loper\Desktop\version_6\MedFlowPH\output_source\05\KSelection\k_metrics_long.csv; C:\Users\loper\Desktop\version_6\MedFlowPH\output_source\05\KSelection\k_selection_summary.json; C:\Users\loper\Desktop\version_6\MedFlowPH\results\04\Summaries\cluster_counts.json
  DBSCAN: C:\Users\loper\Desktop\version_6\MedFlowPH\output_source\05B\DBSCAN_Evaluation\dbscan_metrics_grid.csv; C:\Users\loper\Desktop\version_6\MedFlowPH\output_source\05B\DBSCAN_Evaluation\dbscan_selection_summary.json; C:\Users\loper\Desktop\version_6\MedFlowPH\results\04B\Summaries\dbscan_cluster_counts.json

Optional narrative inputs (referenced when present):
  C:\Users\loper\Desktop\version_6\MedFlowPH\output_source\06\Interpretation\cluster_semantic_map.csv
  C:\Users\loper\Desktop\version_6\MedFlowPH\output_source\06\Interpretation\cluster_theme_profiles.csv
  C:\Users\loper\Desktop\version_6\MedFlowPH\output_source\06B\Interpretation\dbscan_cluster_semantic_map.csv
  C:\Users\loper\Desktop\version_6\MedFlowPH\output_source\06B\Interpretation\dbscan_cluster_theme_profiles.csv
