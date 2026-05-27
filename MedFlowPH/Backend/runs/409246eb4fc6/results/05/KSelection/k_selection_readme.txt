PhilGEPS step 05 — K-selection for K-means

Inputs:
  output_source/03/Clustering/philgeps_clustering_pc_scores.csv (PC1, PC2, PC3 from step 03)

Process:
  K grid: 2..7; metrics computed on a fixed subsample of 80,000 of 487,605 rows
  (deterministic via RANDOM_SEED). For each K we fit KMeans(n_clusters=K, random_state=RANDOM_SEED,
  n_init=10, algorithm='lloyd') and record:
    silhouette        — sklearn.metrics.silhouette_score (higher better)   [P1: argmax]
    davies_bouldin    — sklearn.metrics.davies_bouldin_score (lower better) [P3: argmin]
    calinski_harabasz — sklearn.metrics.calinski_harabasz_score (higher better)
    composite         — (z_silhouette + z_calinski_harabasz - z_davies_bouldin) / sqrt(3)                                [P2: argmax]
    inertia           — KMeans.inertia_ on subsample (elbow plot only)

Primary selection: argmax silhouette → chosen_k = 6.
Step 04 reads chosen_k from k_selection_summary.json and refits KMeans on the FULL PC matrix.

Plots (results/05/KSelection):
  silhouette_vs_k.png, davies_bouldin_vs_k.png, calinski_harabasz_vs_k.png,
  composite_vs_k.png, elbow_inertia_vs_k.png
  combined_silhouette_db_ch_composite_vs_k.png — silhouette, DB (inverted), CH, composite
    on one chart (each min–max normalized so higher = better); gold star = best K (silhouette).

Diagnostic EDA (results/05/EDA):
  cluster_sizes_per_k.png   — per-K bar chart of cluster sizes (eval subsample)
  metric_rank_heatmap.png   — rank of each K within each metric

Notes:
  * Subsample silhouette/CH/DB are estimates of the full-data values. They suffice for
    K selection on this PC cloud (~487k rows). Pass --metrics-on-full for full-data scoring
    (slow due to silhouette O(n^2)).
  * inertia is reported on the same subsample as the other metrics; it is intended only as
    an elbow diagnostic, not a selection criterion.
