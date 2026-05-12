import { IframePanel } from '../components/IframePanel'
import { PageShell } from '../components/PageShell'
import { PageTOC, TOC_INTERPRETATION } from '../components/PageTOC'
import { INTERACTIVE } from '../data/fileManifest'

export function Interpretation() {
  return (
    <PageShell>
      <div className="flex gap-8">
        <div className="min-w-0 flex-1 space-y-12">
          <IframePanel
            id="interpretation-pca-3d"
            src={INTERACTIVE.pca3d}
            title="Interactive 3D PCA space (pre‑clustering)"
            height={600}
          />
          <IframePanel
            id="interpretation-kmeans-3d"
            src={INTERACTIVE.kmeans3d}
            title="Interactive 3D K‑Means PCA space"
            height={600}
          />
          <IframePanel
            id="interpretation-dbscan-3d"
            src={INTERACTIVE.dbscan3d}
            title="Interactive 3D DBSCAN PCA space"
            height={600}
          />
        </div>

        <aside className="medflow-no-print hidden w-48 shrink-0 xl:block">
          <PageTOC sections={TOC_INTERPRETATION} />
        </aside>
      </div>
    </PageShell>
  )
}
