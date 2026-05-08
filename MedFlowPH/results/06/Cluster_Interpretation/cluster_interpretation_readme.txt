PhilGEPS step 06 — Cluster interpretation

Inputs:
  output_source/04/KMeans/philgeps_kmeans_assignments.csv     (row_index, cluster_id, PC1..PC3)
  output_source/04/Backtrack/philgeps_cluster_backtrack.csv (scaled theme + base columns from Layer C)
  output_source/02/Feature Selection/philgeps_features_selected.csv  (Layer A; positional merge by row)
  output_source/01/philgeps_medical_procurement.csv  (Step 01 originals; additive merge by row)
  output_source/03/Clustering/philgeps_clustering_pc_scores.csv (PC1..PC3 for the 3D plot)
  results/03/Clustering/pca_theme_clustering.json             (PC1..PC3 explained-variance ratios)

Method:
  Theme columns are z-scored vs cohort; ``cluster_label`` is the plain-language segment name
  from those z-scores (see ``cluster_short_title_from_theme_z``). ``rationale_short`` lists numeric theme z-scores
  only—there are no ``+theme`` / ``−theme`` tags in CSV or PNG outputs.
  Full theme means and z tables remain in ``cluster_theme_profiles.csv`` and in the EDA heatmaps.

Column naming (wide merge outputs):
  Prefix ``backtrack_mm__`` = Step 04 Min–Max scaled copy when Layer A also has that header (unprefixed = Layer A).
  Prefix ``procurement__`` = Step 01 procurement column renamed because the merge frame already had that header.
  The combined CSV has unique column names; collisions are resolved by renaming one side, never overwriting.
  See ``philgeps_cluster_backtrack_layer_a_column_map.csv`` for each column's provenance and original header.

Outputs:
  output_source/06/Interpretation/cluster_semantic_map.csv           (cluster_id, cluster_label, rationale_short)
  output_source/06/Interpretation/cluster_theme_profiles.csv         (per-cluster count, share, theme & base mean / z)
  output_source/06/Interpretation/philgeps_cluster_backtrack_layer_a.csv
      Full cartesian row alignment: step 04 row keys plus Layer A plus Step 01 procurement columns.
      Shared column names: Min–Max scaled values from step 04 appear as ``backtrack_mm__<col>``; Layer A keeps ``<col>``.
      Procurement columns keep original names except where they collide with existing columns, then ``procurement__<col>``.
  output_source/06/Interpretation/philgeps_cluster_backtrack_layer_a_column_map.csv
      One row per column in the wide merge (position, column_name, provenance, source_header_original).
      Provenance values: ``step04_backtrack_minmax_overlap``, ``layer_a_features_selected``, ``step04_backtrack_only``,
      ``step01_procurement_collision``, ``step01_procurement_only``.
  output_source/06/Interpretation/per_cluster_full/philgeps_cluster_<id>_layer_a_full.csv
      Same schema as the combined file; one CSV per cluster_id (stale ``philgeps_cluster_*_layer_a_full.csv`` removed before write).
  results/06/Cluster_Interpretation/EDA/
    cluster_size_bar.png          cluster sizes (full data)
    theme_means_heatmap.png     clusters × theme columns (mean)
    theme_z_heatmap.png         clusters × theme columns (z vs global)
    theme_means_per_cluster.png grouped bar (clusters × theme means)
    base_means_heatmap.png      clusters × POLICY_PCA_BASE_COLUMNS (mean)
  results/04/PCA_Cluster/
    pca_space_pc123_3d_kmeans_numeric.png      refreshed here: **numeric** legend ``C0``…``Ck`` only (same subsample/jitter as semantic; distinct from semantic PNG).
    pca_space_pc123_3d_kmeans_interactive.html Plotly 3D scatter (semantic legend); click loads JSON once.
    pca_space_pc123_3d_kmeans_interactive_rows.json Subsample only: eight wide-merge fields keyed by ``row_index``.
    pca_space_pc123_3d_kmeans_semantic.png    3D scatter with semantic legend (color-key table only in cluster_semantic_legend_table.png).
    cluster_semantic_legend_table.png       cluster_id × cluster_label (no theme-tag column)

Pipeline summary:
  Step 03 (PCA) -> Step 05 (K selection by silhouette) -> Step 04 (full K-means fit) -> Step 06 (this).
  K = 6; total rows = 487,605; clusters = 6.

Row alignment:
  Assignments, backtrack, PC scores, Layer A ``philgeps_features_selected``, and Step 01 ``philgeps_medical_procurement``
  share the same row order when produced by steps 01→02→03→04 without row subsampling. The ``row_index`` column persisted by step 04 is
  the canonical key and equals the zero-based position in Layer A (step 02 writes ``index=False``).
