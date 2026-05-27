PhilGEPS step 04 — Final K-means fit on PC scores

Inputs:
  output_source/03/Clustering/philgeps_clustering_pc_scores.csv      (PC1..PC3 from step 03)
  output_source/05/KSelection/k_selection_summary.json                (chosen_k from step 05)
  output_source/02/Min-Max Scaling/philgeps_min_max_scaled.csv        (theme + base columns for backtrack)

Process:
  K = 6; one fit on the full PC matrix (n=487,605):
    KMeans(n_clusters=6, random_state=42, n_init=10, algorithm='lloyd')

Row alignment:
  Step 03 writes PC scores in the same row order as the scaled numerics CSV (default RangeIndex).
  Step 04 joins backtrack columns by row position (no shuffling between steps). The
  ``row_index`` column persisted with the assignments is the RangeIndex from step 03.

Outputs:
  output_source/04/KMeans/philgeps_kmeans_assignments.csv  — row_index, cluster_id, PC1..PC3
  output_source/04/Backtrack/philgeps_cluster_backtrack.csv
                                                          — row_index, cluster_id, PC1..PC3,
                                                            POLICY_THEME_SCORE_COLUMNS,
                                                            POLICY_PCA_BASE_COLUMNS
  output_source/04/per_cluster/cluster_{cid}.csv         — one CSV per cluster (rows from backtrack)
  results/04/PCA_Cluster/pca_space_pc123_3d_kmeans_numeric.png
                                                          — numeric legend (C0, C1, …); step 04 writes first pass;
                                                            step 06 refreshes for aligned subsample/jitter (**still C0…Ck**, not semantic text).
  results/04/PCA_Cluster/pca_space_pc123_3d_kmeans_semantic.png
                                                          — step 06 only; same scatter settings as numeric but semantic legend.
  results/04/PCA_Cluster/pca_space_pc123_3d_kmeans_interactive.html (+ *_interactive_rows.json)
                                                          — written by step 06 (Plotly; requires plotly); click payload
                                                            from the wide merge (see step 06 readme).

Step 06 reads these outputs to assign semantic names and write
``pca_space_pc123_3d_kmeans_semantic.png``, refresh ``pca_space_pc123_3d_kmeans_numeric.png`` (numeric legend),
and interactive HTML when plotly is installed.
