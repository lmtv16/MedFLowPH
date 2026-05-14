import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { SectionWrapper } from './SectionWrapper'

const policyThemeRows = [
  {
    theme: 'High Risk Shortage',
    formula:
      'high_risk_shortage = (0.35 × Bid Notice Status score) + (0.35 × Procurement Mode score) + (0.30 × Award Decision Lag rank)',
    weights: 'Bid Notice Status = 35%\nProcurement Mode = 35%\nAward Decision Lag = 30%',
    explanation:
      'This score estimates procurement stress. A record gets a higher score if the bid status shows failed, cancelled, or revoked patterns, if the procurement mode suggests emergency or failed bidding, and if the award decision took longer.',
  },
  {
    theme: 'Low Risk Shortage',
    formula: 'low_risk_shortage = 1 − high_risk_shortage',
    weights: 'Complement of high-risk shortage',
    explanation:
      'This is the opposite of the shortage-risk score. If the high-risk shortage score is low, then the low-risk shortage score becomes high.',
  },
  {
    theme: 'Overstocking / High Ordering Intensity',
    formula: 'inventory_intensity = average(rank(log1p_Quantity), rank(log1p_Item_Budget))\noverstocking = inventory_intensity',
    weights: 'Quantity rank = 50%\nItem Budget rank = 50%',
    explanation:
      'This does not prove actual overstocking. It only means the procurement record has relatively high quantity and item budget compared with other records.',
  },
  {
    theme: 'Understocking / Low Ordering Intensity',
    formula: 'understocking = 1 − inventory_intensity',
    weights: 'Complement of inventory intensity',
    explanation:
      'This does not prove actual understocking. It only means the procurement record has relatively low quantity and item budget compared with other records.',
  },
  {
    theme: 'Normal Inventory',
    formula: 'normal_inventory = 1 − 2 × abs(inventory_intensity − 0.5)',
    weights: 'Based on closeness to middle value 0.5',
    explanation:
      'This score is highest when the inventory intensity is near the middle. It means the procurement record is neither very high nor very low in quantity and item budget.',
  },
  {
    theme: 'Unequal Supply Regions',
    formula: 'HHI = sum(region_share²)\nunequal_supply_regions = (HHI − uniform_HHI) / (1 − uniform_HHI)',
    weights: 'Based on contract amount concentration across regions',
    explanation:
      'This measures whether procurement value is concentrated in only a few regions for the same client agency and year. A higher value means more regional concentration.',
  },
  {
    theme: 'Equal Supply Regions',
    formula: 'equal_supply_regions = 1 − unequal_supply_regions',
    weights: 'Complement of unequal supply regions',
    explanation:
      'This is the opposite of regional concentration. A higher value means procurement value is more evenly distributed across observed regions.',
  },
]

const formulaNoteRows = [
  {
    component: 'Bid Notice Status score',
    how: '1 if the status contains words like cancel, fail, or revok; otherwise 0',
    meaning: 'Detects failed, cancelled, or revoked procurement signals.',
  },
  {
    component: 'Procurement Mode score',
    how: '1 if the mode contains emergency, two failed, 53.2, or failed bidding; otherwise 0',
    meaning: 'Detects emergency or failed-bidding procurement patterns.',
  },
  {
    component: 'Award Decision Lag rank',
    how: 'Percentile rank of award_decision_lag_days',
    meaning: 'Longer award decision delay gets a higher rank.',
  },
  {
    component: 'Quantity rank',
    how: 'Percentile rank of log1p_Quantity',
    meaning: 'Higher quantity gets a higher score.',
  },
  {
    component: 'Item Budget rank',
    how: 'Percentile rank of log1p_Item_Budget',
    meaning: 'Higher item budget gets a higher score.',
  },
  {
    component: 'Region share',
    how: 'region contract amount / total contract amount within the same Client Agency and Year',
    meaning: 'Shows how much procurement value goes to each region.',
  },
  {
    component: 'HHI',
    how: 'sum(region_share²)',
    meaning: 'Measures concentration; higher HHI means fewer regions dominate.',
  },
]

interface Props {
  defaultOpen?: boolean
}

export default function PolicyThemeFormulaReference({ defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <SectionWrapper id="formula-reference">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mb-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors duration-150 hover:bg-slate-50 dark:border-border dark:bg-card dark:hover:bg-muted/40"
      >
        <span className="font-heading text-lg font-semibold text-slate-800 dark:text-foreground">
          View Policy Theme Proxy Formulas
        </span>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
        )}
      </button>

      {open ? (
        <div className="space-y-8">
          <div>
            <h2 className="mb-2 border-l-4 border-blue-700 pl-3 font-heading text-xl font-semibold text-slate-800 dark:text-foreground">
              Policy Theme Proxy Formula Reference
            </h2>
            <p className="text-mf-body leading-relaxed text-slate-500 dark:text-muted-foreground">
              The policy-theme scores are{' '}
              <span className="rounded bg-amber-50 px-1 font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                proxy indicators
              </span>{' '}
              used to guide cluster interpretation. They{' '}
              <span className="rounded bg-red-50 px-1 font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
                do not directly prove
              </span>{' '}
              actual medicine shortage, overstocking, understocking, or supply inequity. Final cluster interpretation should
              still be supported by backtracked row-count evidence from the original procurement columns.
            </p>
          </div>

          <div>
            <h3 className="mb-3 font-heading text-base font-semibold text-slate-700 dark:text-foreground">
              Policy Theme Proxy Scores
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-border dark:bg-muted/40">
                    <th className="min-w-[160px] p-3 text-left font-medium text-slate-600 dark:text-muted-foreground">
                      Label Theme
                    </th>
                    <th className="min-w-[280px] p-3 text-left font-medium text-slate-600 dark:text-muted-foreground">
                      Formula
                    </th>
                    <th className="min-w-[180px] p-3 text-left font-medium text-slate-600 dark:text-muted-foreground">
                      Weights
                    </th>
                    <th className="min-w-[220px] p-3 text-left font-medium text-slate-600 dark:text-muted-foreground">
                      Explanation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {policyThemeRows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-slate-50/50 dark:bg-muted/20'}>
                      <td className="p-3 align-top font-medium text-blue-700 dark:text-blue-400">{row.theme}</td>
                      <td className="p-3 align-top">
                        <code className="block whitespace-pre-wrap rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 dark:bg-muted dark:text-foreground">
                          {row.formula}
                        </code>
                      </td>
                      <td className="p-3 align-top whitespace-pre-line text-xs text-slate-600 dark:text-muted-foreground">
                        {row.weights}
                      </td>
                      <td className="p-3 align-top leading-relaxed text-slate-600 dark:text-muted-foreground">
                        {row.explanation.includes('does not prove') ? (
                          <>
                            {row.explanation.split('does not prove')[0]}
                            <span className="rounded bg-red-50 px-1 font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
                              does not prove
                            </span>
                            {row.explanation.split('does not prove')[1]}
                          </>
                        ) : (
                          row.explanation
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-1 font-heading text-base font-semibold text-slate-700 dark:text-foreground">
              Simple Formula Notes
            </h3>
            <p className="mb-3 text-xs text-slate-500 dark:text-muted-foreground">
              These components explain how the proxy variables were derived before being used as guide indicators for cluster
              interpretation.
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-border dark:bg-muted/40">
                    <th className="min-w-[180px] p-3 text-left font-medium text-slate-600 dark:text-muted-foreground">
                      Component
                    </th>
                    <th className="min-w-[260px] p-3 text-left font-medium text-slate-600 dark:text-muted-foreground">
                      How it is computed
                    </th>
                    <th className="min-w-[200px] p-3 text-left font-medium text-slate-600 dark:text-muted-foreground">
                      Meaning
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formulaNoteRows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-slate-50/50 dark:bg-muted/20'}>
                      <td className="bg-blue-50/30 p-3 align-top font-mono text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                        {row.component}
                      </td>
                      <td className="p-3 align-top">
                        <code className="block whitespace-pre-wrap rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 dark:bg-muted dark:text-foreground">
                          {row.how}
                        </code>
                      </td>
                      <td className="p-3 align-top leading-relaxed text-slate-600 dark:text-muted-foreground">
                        {row.meaning}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800/50 dark:bg-amber-950/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <div>
                <h4 className="mb-2 font-heading font-semibold text-amber-800 dark:text-amber-300">Interpretation Note</h4>
                <p className="text-mf-body leading-relaxed text-amber-700 dark:text-amber-200/90">
                  The policy theme scores were computed as <span className="font-semibold">proxy indicators</span> rather than{' '}
                  <span className="font-semibold">direct proof</span> of actual shortage, overstocking, understocking, or
                  equity. The shortage-risk proxy used weighted procurement-stress indicators: bid notice status, procurement
                  mode, and award decision delay. The inventory-posture proxy used the percentile ranks of quantity and item
                  budget to estimate ordering intensity. The regional supply proxy used a normalized Herfindahl-Hirschman Index
                  to measure whether procurement value was concentrated across regions within the same client agency and year.
                  These scores were used as guide indicators, while the final cluster interpretation was{' '}
                  <span className="font-semibold">supported by backtracked row-count evidence</span> from the original
                  procurement columns.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </SectionWrapper>
  )
}
