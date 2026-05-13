import { motion } from 'framer-motion'
import { ClusterFigureLayout, type FigureCaptions } from '../components/ClusterFigureLayout'
import { IframePanel } from '../components/IframePanel'
import { ImageCard } from '../components/ImageCard'
import { PageShell } from '../components/PageShell'
import { PageTOC, TOC_PCA } from '../components/PageTOC'
import { SectionWrapper } from '../components/SectionWrapper'

const PCA_LOADINGS = '/results/03/Clustering/pca_loadings_pc123.png'
const PCA_VARIANCE = '/results/03/Clustering/cumulative_variance_pca.png'
const PCA_3D = '/results/03/Clustering/pca_space_pc123_3d.png'
const PCA_3D_SOLID = '/results/03/Clustering/pca_space_pc123_3d_solid.png'
const PCA_INTERACTIVE = '/results/03/Clustering/pca_space_pc123_3d_interactive.html'

const PCA_LOADINGS_CAPTIONS: FigureCaptions = [
  'This heatmap shows which numeric features contribute most to each PCA dimension. PC1 is mainly driven by item budget and contract amount, PC2 is driven by quantity and approved budget, and PC3 is strongly driven by award decision lag.',
  'This means the PCA space summarizes procurement records into three main patterns: monetary size, volume or budget behavior, and decision delay. These PCA scores are then used for clustering.',
]

const PCA_VARIANCE_CAPTIONS: FigureCaptions = [
  <>
    This chart shows how much information is retained after reducing the numeric features using PCA. The first three
    components explain{' '}
    <strong className="font-semibold text-mf-ink dark:text-foreground">80.05%</strong> of the total variance.
  </>,
  'This means PC1, PC2, and PC3 capture most of the important numeric patterns while making the data easier to visualize and cluster.',
]

const PCA_3D_CAPTIONS: FigureCaptions = [
  <>
    This plot shows medical procurement records in a three-dimensional PCA space before clustering. PC1, PC2, and PC3
    together explain about{' '}
    <strong className="font-semibold text-mf-ink dark:text-foreground">80%</strong> of the variation in the selected
    numeric features.
  </>,
  'The visible dense regions and separated layers suggest that procurement records have meaningful structure. This PCA space is used as the input for K-means and DBSCAN clustering.',
]

const PCA_3D_SOLID_CAPTIONS: FigureCaptions = [
  'This solid-rendered view of the same three-dimensional PCA space highlights the bulk shape and density of the projected records. Opaque markers make it easier to see where the cloud is concentrated versus where it thins out.',
  'Reading it alongside the scatter view helps confirm that the visible clusters are not just rendering artifacts, and gives a second look at the structure that K-means and DBSCAN will partition.',
]

export function PCAPage() {
  return (
    <PageShell>
      <div className="flex gap-8">
        <main className="min-w-0 flex-1 space-y-12 pb-16">
          <motion.div className="space-y-12">
            <SectionWrapper id="pca-overview">
              <h1 className="mb-2 font-heading text-3xl font-bold text-slate-800 dark:text-foreground">
                Principal Component Analysis (PCA)
              </h1>
              <p className="mb-3 text-lg font-medium text-blue-700 dark:text-blue-400">
                Compressing scaled features into orthogonal axes for clustering and 3D visualization.
              </p>
              <p className="max-w-3xl leading-relaxed text-slate-600 dark:text-muted-foreground">
                PCA compresses the scaled feature block into orthogonal axes that preserve bulk variance while enabling 3D
                visualization prior to clustering overlays.
              </p>
            </SectionWrapper>

            <SectionWrapper id="pca-loadings" title="Feature Loadings & Explained Variance">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-14">
                <ClusterFigureLayout
                  figureNum={1}
                  title="PCA Feature Loadings"
                  footerParagraphs={PCA_LOADINGS_CAPTIONS}
                >
                  <ImageCard src={PCA_LOADINGS} title="PCA Feature Loadings" hideInlineTitle />
                </ClusterFigureLayout>

                <ClusterFigureLayout
                  figureNum={2}
                  title="PCA Explained Variance"
                  footerParagraphs={PCA_VARIANCE_CAPTIONS}
                >
                  <ImageCard src={PCA_VARIANCE} title="PCA Explained Variance" hideInlineTitle />
                </ClusterFigureLayout>
              </div>
            </SectionWrapper>

            <SectionWrapper id="pca-3d" title="3D Projections">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-14">
                <ClusterFigureLayout
                  figureNum={3}
                  title="PCA 3D Scatter"
                  footerParagraphs={PCA_3D_CAPTIONS}
                >
                  <ImageCard src={PCA_3D} title="PCA 3D Scatter" hideInlineTitle />
                </ClusterFigureLayout>

                <ClusterFigureLayout
                  figureNum={4}
                  title="PCA space — solid view"
                  footerParagraphs={PCA_3D_SOLID_CAPTIONS}
                >
                  <ImageCard src={PCA_3D_SOLID} title="PCA space — solid view" hideInlineTitle />
                </ClusterFigureLayout>
              </div>
            </SectionWrapper>

            <SectionWrapper id="pca-interactive" title="Interactive PCA">
              <IframePanel src={PCA_INTERACTIVE} title="Interactive PCA View" height={600} />
            </SectionWrapper>
          </motion.div>
        </main>

        <aside className="medflow-no-print hidden w-48 shrink-0 xl:block">
          <PageTOC sections={TOC_PCA} />
        </aside>
      </div>
    </PageShell>
  )
}
