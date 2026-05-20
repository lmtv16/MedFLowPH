PhilGEPS step 03 — PCA / dimensionality (after step 02)

Input: subset of D:\medflowv6\MedFlow\MedFlowPH\output_source\02\Min-Max Scaling\philgeps_min_max_scaled.csv (award_decision_lag_days, log1p_Quantity, log1p_Approved_Budget_of_the_Contract, log1p_Item_Budget, log1p_Contract_Amount)
PCA input shape: 487605 rows x 5 features (after dropping near-constant columns, if any)
Feature columns: award_decision_lag_days, log1p_Quantity, log1p_Approved_Budget_of_the_Contract, log1p_Item_Budget, log1p_Contract_Amount
PCA was fit on StandardScaler outputs (zero mean, unit variance per column). Loadings/PCs are with respect to those z-scores, not raw min–max magnitudes.

Outputs (same row order as PCA input; join by position):
- D:\medflowv6\MedFlow\MedFlowPH\output_source\03\Clustering\philgeps_clustering_features.csv  (pre-z-score min–max values; columns match PCA feature_names in JSON)
- D:\medflowv6\MedFlow\MedFlowPH\output_source\03\Clustering\philgeps_clustering_pc_scores.csv  (PC1, PC2, PC3)
- D:\medflowv6\MedFlow\MedFlowPH\results\03\Clustering\pca_theme_clustering.json  (includes standardized_before_pca, scaler_mean/scale when used, feature_names)
- D:\medflowv6\MedFlow\MedFlowPH\results\03\Clustering\pca_pc123_dominance_audit.json  (Pearson correlations + PC1–3 loading participation by feature)
- D:\medflowv6\MedFlow\MedFlowPH\results\03\Clustering\cumulative_variance_pca.png, D:\medflowv6\MedFlow\MedFlowPH\results\03\Clustering\pca_loadings_pc123.csv, D:\medflowv6\MedFlow\MedFlowPH\results\03\Clustering\pca_loadings_pc123.png
- D:\medflowv6\MedFlow\MedFlowPH\results\03\Clustering\pca_space_pc123_3d.png  (v5-style 3D; KNN density colormap (k=24, PNG only); plot jitter 0.025 * max(ptp, std) on subsample; see JSON pc3d_png_* keys)
- D:\medflowv6\MedFlow\MedFlowPH\results\03\Clustering\pca_space_pc123_3d_solid.png  (same subsample and jitter rules; always single-color steelblue, no density colorbar)
- D:\medflowv6\MedFlow\MedFlowPH\results\03\Clustering\pca_space_pc123_3d_interactive.html  (Plotly: click loads pca_space_pc123_3d_interactive_rows.json once; full FS row JSON; use HTTP server if file:// blocks fetch)


Legacy v5 ``03_kmeans_implementation_philgeps.py`` uses a wider StandardScaler matrix for clustering; this step uses Layer C subsets—geometry differs unless you harmonize inputs.
