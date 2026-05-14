import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Flag, LayoutGrid, MapPin, Scale } from 'lucide-react'
import type { PointerEvent, ReactNode } from 'react'
import { Children, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ImageCard } from '../components/ImageCard'
import { LazyIframePanel } from '../components/LazyIframePanel'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { PageShell } from '../components/PageShell'
import { PageTOC, TOC_INTERPRETATION } from '../components/PageTOC'
import { SectionHeader } from '../components/SectionHeader'
import { SectionWrapper } from '../components/SectionWrapper'
import { DATA_PATHS, INTERACTIVE } from '../data/fileManifest'
import { useCsvData } from '../hooks/useCsvData'

const POLICY_CLUSTER_IDS = [0, 1, 2, 3, 4, 5] as const

/** Selected DBSCAN clusters + noise; matches results/06B/Cluster_Interpretation/Policy_Evidence/cluster_* and noise. */
const DBSCAN_INSIGHT_IDS = [0, 119, 25, 26, 27, -1] as const

/** Cards per carousel “page”; each page uses the same responsive grid below. */
const DBSCAN_INSIGHT_GRID_PAGE_SIZE = 6

const DBSCAN_POLICY_CLUSTER_OTHER_ROOT =
  '/results/06B/Cluster_Interpretation/Policy_Evidence/cluster_other'

const DBSCAN_POLICY_CLUSTER_OTHER_SUMMARY_FILES = [
  'evidence_procurement_mode_summary.json',
  'evidence_contract_amount_summary.json',
  'evidence_item_budget_summary.json',
  'evidence_quantity_summary.json',
  'evidence_bid_notice_status_summary.json',
  'evidence_business_category_summary.json',
  'evidence_region_summary.json',
  'evidence_year_summary.json',
] as const

type DbscanPolicyClusterOtherSummary = {
  cluster_id?: number
  column_name?: string
  logical_column?: string
  top_value?: string
  cluster_rows?: number
  top_share_within_cluster?: number
  lift_vs_global?: number
}

const OVERALL_CLUSTER_SUMMARY_ROWS: { cluster: number; label: string; meaning: string }[] = [
  {
    cluster: 0,
    label: 'High-Value Centralized Public Procurement Segment',
    meaning:
      'Very high-value, awarded, public bidding-based procurement concentrated in NCR/Luzon.',
  },
  {
    cluster: 1,
    label: 'Low-Value High-Quantity Routine Supply Segment',
    meaning: 'High-quantity but low-cost routine medical-related procurement.',
  },
  {
    cluster: 2,
    label: 'Delayed Medium-Value Centralized Procurement Segment',
    meaning: 'Moderate-value procurement with strong decision and publishing delay signals.',
  },
  {
    cluster: 3,
    label: 'Stable Routine Medical Procurement Segment',
    meaning:
      'More stable procurement behavior with mostly awarded records and lower delay indicators.',
  },
  {
    cluster: 4,
    label: 'High-Volume High-Budget Delayed Procurement Segment',
    meaning: 'Large-scale, high-volume, high-budget procurement with notable delay patterns.',
  },
  {
    cluster: 5,
    label: 'High-Volume Low-to-Medium Cost Public Bidding Segment',
    meaning:
      'Bulk procurement of lower to medium-cost medical-related items through formal public bidding.',
  },
]

const OVERALL_CONCLUSION_USES = [
  'better monitoring of high-value procurement',
  'review of delay-prone procurement activities',
  'identification of routine bulk supply needs',
  'analysis of NCR, Metro Manila, and Luzon supplier concentration',
  'comparison of stable and delayed procurement groups',
  'improvement of resource allocation planning',
  'clearer dashboard-based reporting for public health procurement decisions',
] as const

const DBSCAN_OVERALL_SUMMARY_ROWS: { group: string; label: string; meaning: string }[] = [
  {
    group: 'Cluster 0',
    label: 'NCR-Centered Medium-to-High Value Medical Procurement Segment',
    meaning: 'Small, institution-centered procurement group with moderate-to-high value.',
  },
  {
    group: 'Cluster 25',
    label: 'Emergency High-Quantity Medical Procurement Segment',
    meaning: 'Emergency procurement with high quantity and relatively fast award processing.',
  },
  {
    group: 'Cluster 26',
    label: 'High-Value Emergency Medical Supply Segment',
    meaning: 'High-value, high-volume emergency procurement with longer closing time.',
  },
  {
    group: 'Cluster 27',
    label: 'Active Public Bidding Medical Supply Segment',
    meaning: 'Active or ongoing public bidding records with moderate value and high time-to-close.',
  },
  {
    group: 'Cluster 119',
    label: 'Low-Cost Small Value Routine Medical Procurement Segment',
    meaning: 'Routine small-value procurement with high quantity and lower cost.',
  },
  {
    group: 'Other Minor Clusters',
    label: 'Broad Mixed Medical Procurement Segment',
    meaning: 'Mixed smaller dense clusters showing varied procurement behavior.',
  },
  {
    group: 'Noise',
    label: 'Outlier and Sparse Procurement Records',
    meaning:
      'Records that do not belong to dense groups and may require closer review.',
  },
]

const DBSCAN_OVERALL_IDENTIFY_BULLETS = [
  'emergency procurement patterns',
  'small-value routine procurement groups',
  'NCR and Metro Manila-centered procurement concentration',
  'active public bidding records',
  'high-value and high-volume emergency procurement',
  'sparse or unusual records labeled as noise',
  'procurement groups that may require closer monitoring',
] as const

const POLICY_BAR_FILES = [
  'evidence_procurement_mode_bar.png',
  'evidence_contract_amount_bar.png',
  'evidence_approved_budget_of_the_contract_bar.png',
  'evidence_item_budget_bar.png',
  'evidence_quantity_bar.png',
  'evidence_uom_bar.png',
  'evidence_year_bar.png',
  'evidence_bid_notice_status_bar.png',
  'evidence_time_to_close_days_bar.png',
  'evidence_award_decision_lag_days_bar.png',
  'evidence_award_publish_lag_days_bar.png',
  'evidence_client_agency_bar.png',
  'evidence_business_category_bar.png',
  'evidence_region_bar.png',
  'evidence_province_bar.png',
  'evidence_buyer_island_bar.png',
  'evidence_region_of_awardee_bar.png',
  'evidence_province_of_awardee_bar.png',
  'evidence_supplier_island_bar.png',
  'evidence_awardee_organization_name_bar.png',
  'evidence_item_name_bar.png',
  'evidence_unspsc_description_bar.png',
] as const

function policyChartTitle(filename: string): string {
  const base = filename
    .replace(/^evidence_/, '')
    .replace(/_bar\.png$/i, '')
    .replace(/\.png$/i, '')
  return base
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function policyGalleryForCluster(clusterId: number): GalleryImage[] {
  const root = `/results/06/Cluster_Interpretation/Policy_Evidence/cluster_${clusterId}`
  return POLICY_BAR_FILES.map((f) => ({
    src: `${root}/${f}`,
    title: `Cluster ${clusterId} — ${policyChartTitle(f)}`,
  }))
}

const DBSCAN_POLICY_EVIDENCE_ROOT = '/results/06B/Cluster_Interpretation/Policy_Evidence'

/** Policy bar chart folders under 06B (DBSCAN interpretation outputs). */
const DBSCAN_POLICY_EVIDENCE_TABS = [
  { folder: 'cluster_0', label: 'Cluster 0' },
  { folder: 'cluster_119', label: 'Cluster 119' },
  { folder: 'cluster_25', label: 'Cluster 25' },
  { folder: 'cluster_26', label: 'Cluster 26' },
  { folder: 'cluster_27', label: 'Cluster 27' },
  { folder: 'noise', label: 'Noise' },
  { folder: 'cluster_other', label: 'Other (pooled)' },
] as const

function policyGalleryForDbscanPolicyFolder(
  folder: (typeof DBSCAN_POLICY_EVIDENCE_TABS)[number]['folder'],
  displayLabel: string
): GalleryImage[] {
  const root = `${DBSCAN_POLICY_EVIDENCE_ROOT}/${folder}`
  return POLICY_BAR_FILES.map((f) => ({
    src: `${root}/${f}`,
    title: `${displayLabel} — ${policyChartTitle(f)}`,
  }))
}

function formatShare(v: string | undefined): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(1)}%`
}

function formatZ(v: string | undefined): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(2)
}

/** Drop a leading "Summary" heading so it is not repeated inside the collapsible body. */
function semanticRationaleBody(rationale: string): string {
  return rationale.replace(/^\s*Summary\s*\n+/i, '').trimStart()
}

function humanizeMetricKey(key: string): string {
  const raw = key.replace(/^z__/, '').replace(/_/g, ' ')
  return raw
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Rows for a compact per-cluster metrics table (counts, share, z‑columns). */
function tabularThemeMetrics(row: Record<string, string> | undefined): { label: string; value: string }[] {
  if (!row) return []
  const out: { label: string; value: string }[] = []
  const count = row.count?.trim()
  if (count) out.push({ label: 'Records', value: count })
  const share = row.share
  if (share !== undefined && share !== '') out.push({ label: 'Share (cluster)', value: formatShare(share) })
  const zKeys = Object.keys(row)
    .filter((k) => k.startsWith('z__'))
    .sort((a, b) => a.localeCompare(b))
  for (const k of zKeys) {
    out.push({ label: humanizeMetricKey(k), value: formatZ(row[k]) })
  }
  return out
}

type LabelFitEvidence = {
  lead: string
  /** If present, this exact substring of `lead` is rendered in bold. */
  leadBoldPhrase?: string
  rows: { evidence: string; pattern: string; interpretation: string }[]
}

/** Optional narrative + evidence table per cluster (replaces auto “Tabulated metrics” when set). */
const LABEL_FIT_EVIDENCE_BY_CLUSTER: Partial<Record<number, LabelFitEvidence>> = {
  0: {
    lead:
      'The label High-Value Centralized Public Procurement Segment fits because the strongest evidence points to high financial value, formal procurement, and geographic concentration.',
    leadBoldPhrase: 'High-Value Centralized Public Procurement Segment',
    rows: [
      {
        evidence: 'Contract Amount',
        pattern: 'Very High dominates',
        interpretation: 'Strong evidence of high-value awarded procurement transactions.',
      },
      {
        evidence: 'Item Budget',
        pattern: 'Very High dominates',
        interpretation: 'Indicates high item-level budget intensity.',
      },
      {
        evidence: 'Approved Budget of the Contract',
        pattern: 'High and Very High dominate',
        interpretation: 'Shows that the cluster is budget-heavy.',
      },
      {
        evidence: 'Quantity',
        pattern: 'Low dominates',
        interpretation: 'Suggests expensive or lot-based procurement rather than high-unit procurement.',
      },
      {
        evidence: 'UOM',
        pattern: 'Lot dominates',
        interpretation: 'Many records are bundled or grouped procurement lots.',
      },
      {
        evidence: 'Procurement Mode',
        pattern: 'Public Bidding dominates',
        interpretation: 'Mostly formal competitive procurement.',
      },
      {
        evidence: 'Bid Notice Status',
        pattern: 'Awarded dominates',
        interpretation: 'Most records are completed or awarded procurements.',
      },
      {
        evidence: 'Region / Awardee Region',
        pattern: 'NCR dominates',
        interpretation: 'Procurement activity is strongly centralized in NCR.',
      },
      {
        evidence: 'Province of Awardee',
        pattern: 'Metro Manila dominates',
        interpretation: 'Supplier or awardee activity is concentrated in Metro Manila.',
      },
    ],
  },
  1: {
    lead:
      'The label Low-Value High-Quantity Routine Supply Segment fits because the charts show high quantity but low financial intensity.',
    leadBoldPhrase: 'Low-Value High-Quantity Routine Supply Segment',
    rows: [
      {
        evidence: 'Quantity',
        pattern: 'High dominates',
        interpretation: 'Many records involve larger quantities.',
      },
      {
        evidence: 'Contract Amount',
        pattern: 'Low dominates',
        interpretation: 'Procurement value is generally low.',
      },
      {
        evidence: 'Item Budget',
        pattern: 'Low dominates',
        interpretation: 'Item-level cost is low.',
      },
      {
        evidence: 'Approved Budget of the Contract',
        pattern: 'Low and Medium dominate',
        interpretation: 'Planned budget is not high compared with other clusters.',
      },
      {
        evidence: 'Procurement Mode',
        pattern: 'Small Value Procurement and Public Bidding dominate',
        interpretation: 'Indicates routine procurement methods.',
      },
      {
        evidence: 'Bid Notice Status',
        pattern: 'Awarded and Closed dominate',
        interpretation: 'Many records are completed or processed.',
      },
      {
        evidence: 'Business Category',
        pattern: 'Medical supplies, drugs, and lab items dominate',
        interpretation: 'Strongly medical-related procurement activity.',
      },
      {
        evidence: 'Region / Buyer Location',
        pattern: 'Luzon and NCR are strong',
        interpretation: 'Activity is still concentrated in major procurement areas.',
      },
    ],
  },
  2: {
    lead:
      'The label Delayed Medium-Value Centralized Procurement Segment fits because timing delay is the strongest pattern, while contract value is mostly medium.',
    leadBoldPhrase: 'Delayed Medium-Value Centralized Procurement Segment',
    rows: [
      {
        evidence: 'Award Decision Lag',
        pattern: 'Very High dominates',
        interpretation: 'Strong signal of long procurement decision time.',
      },
      {
        evidence: 'Award Publish Lag',
        pattern: 'Very High dominates',
        interpretation: 'Award publication may take longer in this cluster.',
      },
      {
        evidence: 'Contract Amount',
        pattern: 'Medium dominates',
        interpretation: 'Procurement value is moderate, not extremely high.',
      },
      {
        evidence: 'Item Budget',
        pattern: 'Low to Medium dominates',
        interpretation: 'Item-level financial intensity is moderate or low.',
      },
      {
        evidence: 'Bid Notice Status',
        pattern: 'Closed dominates',
        interpretation: 'Many records are completed or closed cases.',
      },
      {
        evidence: 'Region of Awardee',
        pattern: 'NCR dominates',
        interpretation: 'Supplier-side activity is highly centralized.',
      },
      {
        evidence: 'Province of Awardee',
        pattern: 'Metro Manila dominates',
        interpretation: 'Awardees are strongly concentrated in Metro Manila.',
      },
      {
        evidence: 'Procurement Mode',
        pattern: 'Negotiated Procurement and Public Bidding appear strongly',
        interpretation: 'Mixture of formal and negotiated procurement methods.',
      },
    ],
  },
  3: {
    lead:
      'The label Stable Routine Medical Procurement Segment fits because the evidence shows smoother procurement timing and successful procurement outcomes.',
    leadBoldPhrase: 'Stable Routine Medical Procurement Segment',
    rows: [
      {
        evidence: 'Bid Notice Status',
        pattern: 'Awarded dominates',
        interpretation: 'Most records represent successful procurement outcomes.',
      },
      {
        evidence: 'Time to Close',
        pattern: 'Low dominates',
        interpretation: 'Procurement closing time is relatively faster.',
      },
      {
        evidence: 'Award Decision Lag',
        pattern: 'Low and Medium dominate',
        interpretation: 'Decision delays are less severe.',
      },
      {
        evidence: 'Award Publish Lag',
        pattern: 'Low and Medium dominate',
        interpretation: 'Publication timing is more manageable.',
      },
      {
        evidence: 'Contract Amount',
        pattern: 'Medium dominates',
        interpretation: 'Procurement value is moderate.',
      },
      {
        evidence: 'Item Budget',
        pattern: 'High and Medium dominate',
        interpretation: 'Some items still have notable budget intensity.',
      },
      {
        evidence: 'Quantity',
        pattern: 'Low dominates',
        interpretation: 'Not mainly bulk by unit count.',
      },
      {
        evidence: 'Business Category',
        pattern: 'Medical supplies, drugs, and lab supplies dominate',
        interpretation: 'Strong medical-related procurement identity.',
      },
    ],
  },
  4: {
    lead:
      'The label High-Volume High-Budget Delayed Procurement Segment fits because the cluster combines large quantities, large budgets, and longer processing time.',
    leadBoldPhrase: 'High-Volume High-Budget Delayed Procurement Segment',
    rows: [
      {
        evidence: 'Quantity',
        pattern: 'Very High dominates',
        interpretation: 'Strong evidence of high-volume procurement.',
      },
      {
        evidence: 'Approved Budget of the Contract',
        pattern: 'Very High dominates',
        interpretation: 'Large planned procurement allocations.',
      },
      {
        evidence: 'Item Budget',
        pattern: 'Very High and High dominate',
        interpretation: 'High item-level budget intensity.',
      },
      {
        evidence: 'Contract Amount',
        pattern: 'Very High, Medium, and High appear strongly',
        interpretation: 'Financially significant procurement records.',
      },
      {
        evidence: 'Procurement Mode',
        pattern: 'Public Bidding dominates',
        interpretation: 'Formal large-scale procurement process.',
      },
      {
        evidence: 'Time to Close',
        pattern: 'High and Very High dominate',
        interpretation: 'Procurement may take longer to complete.',
      },
      {
        evidence: 'Award Publish Lag',
        pattern: 'High and Very High dominate',
        interpretation: 'Publication delay should be monitored.',
      },
      {
        evidence: 'Award Decision Lag',
        pattern: 'High and Very High dominate',
        interpretation: 'Decision delay is a key concern.',
      },
      {
        evidence: 'Business Category',
        pattern: 'Drugs, medicines, and medical supplies dominate',
        interpretation: 'Strong relevance to public health supply needs.',
      },
    ],
  },
  5: {
    lead:
      'The label High-Volume Low-to-Medium Cost Public Bidding Segment fits because the strongest pattern is high quantity but lower financial value.',
    leadBoldPhrase: 'High-Volume Low-to-Medium Cost Public Bidding Segment',
    rows: [
      {
        evidence: 'Quantity',
        pattern: 'Very High and High dominate',
        interpretation: 'Strong bulk procurement pattern.',
      },
      {
        evidence: 'Contract Amount',
        pattern: 'Low and Medium dominate',
        interpretation: 'Large quantities are not necessarily high-cost.',
      },
      {
        evidence: 'Item Budget',
        pattern: 'Medium and Low dominate',
        interpretation: 'Item-level cost intensity is moderate or low.',
      },
      {
        evidence: 'Approved Budget of the Contract',
        pattern: 'Very High and High appear strongly',
        interpretation: 'Planned budget can still be large because of bulk volume.',
      },
      {
        evidence: 'Procurement Mode',
        pattern: 'Public Bidding dominates',
        interpretation: 'Formal procurement process is common.',
      },
      {
        evidence: 'Bid Notice Status',
        pattern: 'Closed and Awarded dominate',
        interpretation: 'Many records are processed or completed.',
      },
      {
        evidence: 'Time to Close',
        pattern: 'High and Very High dominate',
        interpretation: 'Procurement completion time should be monitored.',
      },
      {
        evidence: 'Award Publish Lag',
        pattern: 'Very High, High, and Low appear',
        interpretation: 'Publication timing varies, with notable delay patterns.',
      },
      {
        evidence: 'Business Category',
        pattern: 'Medical supplies, drugs, and medicines dominate',
        interpretation: 'Strong medical-related procurement relevance.',
      },
    ],
  },
}

/** DBSCAN cards: optional “Why This Label Fits” (replaces auto tabulated theme metrics when set). */
const DBSCAN_LABEL_FIT_EVIDENCE_BY_CLUSTER: Partial<Record<(typeof DBSCAN_INSIGHT_IDS)[number], LabelFitEvidence>> =
  {
    0: {
      lead:
        'The suggested label fits because one client agency and NCR / Metro Manila awardee geography dominate, quantities are relatively high with moderate-to-high value signals, and procurement mixes formal bidding with emergency and small-value routes—mostly closed or awarded.',
      rows: [
        {
          evidence: 'Client Agency',
          pattern: 'Dr. Jose Rizal Memorial Hospital dominates',
          interpretation: 'One institution strongly defines the cluster.',
        },
        {
          evidence: 'Region of Awardee',
          pattern: 'NCR dominates',
          interpretation: 'Awardee activity is highly centralized in NCR.',
        },
        {
          evidence: 'Province of Awardee',
          pattern: 'Metro Manila dominates',
          interpretation: 'Supplier or awardee location is mostly Metro Manila.',
        },
        {
          evidence: 'Quantity',
          pattern: 'High dominates',
          interpretation: 'Records show relatively high procurement quantity.',
        },
        {
          evidence: 'Contract Amount',
          pattern: 'Medium and High dominate',
          interpretation: 'Procurement value is moderate to high.',
        },
        {
          evidence: 'Item Budget',
          pattern: 'Medium and High dominate',
          interpretation: 'Item-level budget is also moderate to high.',
        },
        {
          evidence: 'Procurement Mode',
          pattern: 'Public Bidding, Emergency Procurement, and Small Value Procurement appear strongly',
          interpretation: 'Mixed formal and special procurement methods.',
        },
        {
          evidence: 'Bid Notice Status',
          pattern: 'Closed and Awarded dominate',
          interpretation: 'Most records reached completed or awarded stages.',
        },
      ],
    },
    119: {
      lead:
        'The label fits routine, geographically broader procurement: small-value mode with low contract and item-budget intensity, high quantities, mostly awarded or closed notices, and supplier islands spanning Luzon through Mindanao while NCR and Region III remain prominent.',
      rows: [
        {
          evidence: 'Procurement Mode',
          pattern: 'Small Value Procurement dominates',
          interpretation: 'Strong sign of routine low-value purchases.',
        },
        {
          evidence: 'Contract Amount',
          pattern: 'Low dominates',
          interpretation: 'Procurement value is generally low.',
        },
        {
          evidence: 'Item Budget',
          pattern: 'Low dominates',
          interpretation: 'Item-level financial intensity is low.',
        },
        {
          evidence: 'Quantity',
          pattern: 'High dominates',
          interpretation: 'Many records involve larger quantities.',
        },
        {
          evidence: 'Bid Notice Status',
          pattern: 'Awarded and Closed dominate',
          interpretation: 'Most records are completed or processed.',
        },
        {
          evidence: 'Supplier Island',
          pattern: 'Luzon, Visayas, and Mindanao are represented',
          interpretation: 'Supplier activity is more distributed than smaller clusters.',
        },
        {
          evidence: 'Region',
          pattern: 'NCR and Region III appear strongly',
          interpretation: 'Still has major-region concentration.',
        },
      ],
    },
    25: {
      lead:
        'The label fits an emergency-oriented procurement pocket: emergency mode dominates with high-to-very-high quantities and strong item-budget intensity, moderate contract value, relatively fast award decision and publication timing, mostly awarded notices, and a year profile concentrated in 2020.',
      rows: [
        {
          evidence: 'Procurement Mode',
          pattern: 'Emergency Procurement dominates',
          interpretation: 'Strong signal of urgent procurement activity.',
        },
        {
          evidence: 'Quantity',
          pattern: 'High and Very High dominate',
          interpretation: 'Records involve large quantities.',
        },
        {
          evidence: 'Item Budget',
          pattern: 'High dominates',
          interpretation: 'High item-level budget intensity.',
        },
        {
          evidence: 'Contract Amount',
          pattern: 'Medium dominates',
          interpretation: 'Procurement value is moderate.',
        },
        {
          evidence: 'Award Decision Lag',
          pattern: 'Low dominates',
          interpretation: 'Decision processing was relatively fast.',
        },
        {
          evidence: 'Award Publish Lag',
          pattern: 'Low dominates',
          interpretation: 'Award publication was also relatively fast.',
        },
        {
          evidence: 'Bid Notice Status',
          pattern: 'Awarded dominates',
          interpretation: 'Most records were successfully awarded.',
        },
        {
          evidence: 'Year',
          pattern: '2020 dominates',
          interpretation: 'May reflect emergency procurement demand during an earlier crisis period.',
        },
      ],
    },
    26: {
      lead:
        'The label fits a high-intensity emergency procurement segment: very high quantity, contract value, and item-budget signals sit alongside emergency procurement mode, mostly awarded notices, relatively fast award decision and publication timing, yet very high or high time-to-close—so front-end speed still pairs with prolonged overall closing.',
      rows: [
        {
          evidence: 'Quantity',
          pattern: 'Very High dominates',
          interpretation: 'Strong evidence of large-volume procurement.',
        },
        {
          evidence: 'Contract Amount',
          pattern: 'Very High dominates',
          interpretation: 'Strong evidence of high-value procurement.',
        },
        {
          evidence: 'Item Budget',
          pattern: 'Very High dominates',
          interpretation: 'High item-level financial intensity.',
        },
        {
          evidence: 'Procurement Mode',
          pattern: 'Emergency Procurement dominates',
          interpretation: 'Indicates urgent or special procurement circumstances.',
        },
        {
          evidence: 'Bid Notice Status',
          pattern: 'Awarded dominates',
          interpretation: 'Most records were successfully awarded.',
        },
        {
          evidence: 'Award Decision Lag',
          pattern: 'Low dominates',
          interpretation: 'Award decision was relatively fast.',
        },
        {
          evidence: 'Award Publish Lag',
          pattern: 'Low dominates',
          interpretation: 'Award publication was relatively fast.',
        },
        {
          evidence: 'Time to Close',
          pattern: 'Very High and High dominate',
          interpretation: 'Overall closing time still requires monitoring.',
        },
      ],
    },
    27: {
      lead:
        'The label fits an active, NCR-centered public-bidding slice: notices skew Active, mode is mostly Public Bidding, contract and item budgets read medium with high approved budget, quantities mix low and high, time-to-close runs high for follow-up, and region/awardee signals remain Metro-centric.',
      rows: [
        {
          evidence: 'Bid Notice Status',
          pattern: 'Active dominates',
          interpretation: 'Many records may still be active or not yet fully completed.',
        },
        {
          evidence: 'Procurement Mode',
          pattern: 'Public Bidding dominates',
          interpretation: 'Formal competitive procurement process is common.',
        },
        {
          evidence: 'Contract Amount',
          pattern: 'Medium dominates',
          interpretation: 'Procurement value is moderate.',
        },
        {
          evidence: 'Item Budget',
          pattern: 'Medium dominates',
          interpretation: 'Item-level budget is moderate.',
        },
        {
          evidence: 'Approved Budget',
          pattern: 'High dominates',
          interpretation: 'Planned procurement allocation is high.',
        },
        {
          evidence: 'Quantity',
          pattern: 'Low and High both appear',
          interpretation: 'Mixed quantity behavior.',
        },
        {
          evidence: 'Time to Close',
          pattern: 'High dominates',
          interpretation: 'Procurement timeline may still require monitoring.',
        },
        {
          evidence: 'Region / Awardee Region',
          pattern: 'NCR dominates',
          interpretation: 'Procurement and awardee activity are NCR-centered.',
        },
      ],
    },
    [-1]: {
      lead:
        'The noise label fits because DBSCAN leaves these rows outside dense cores: quantity and approved-budget signals can still be large, contract amounts stay mixed, timing fields show strong or uneven delays, closing time often runs high, and many notices are already closed or awarded—yet the bundle stays analytically irregular.',
      rows: [
        {
          evidence: 'DBSCAN Label',
          pattern: 'Noise / unclustered records',
          interpretation: 'These records do not belong to dense DBSCAN groups.',
        },
        {
          evidence: 'Quantity',
          pattern: 'Very High and High appear strongly',
          interpretation: 'Some outlier records involve large quantities.',
        },
        {
          evidence: 'Approved Budget',
          pattern: 'Very High dominates',
          interpretation: 'Many records have large planned budgets.',
        },
        {
          evidence: 'Contract Amount',
          pattern: 'Medium and Low dominate, with Very High also present',
          interpretation: 'Financial values are mixed and irregular.',
        },
        {
          evidence: 'Award Decision Lag',
          pattern: 'Very High and High dominate',
          interpretation: 'Strong delay-related signal.',
        },
        {
          evidence: 'Award Publish Lag',
          pattern: 'Very High, Low, and High appear',
          interpretation: 'Publication timing is inconsistent.',
        },
        {
          evidence: 'Time to Close',
          pattern: 'High dominates',
          interpretation: 'Closing time may require monitoring.',
        },
        {
          evidence: 'Bid Notice Status',
          pattern: 'Closed and Awarded dominate',
          interpretation: 'Many records are completed but still irregular in pattern.',
        },
      ],
    },
  }

/** “Why This Label Fits” for pooled policy-evidence cluster_other card. */
const DBSCAN_CLUSTER_OTHER_LABEL_FIT: LabelFitEvidence = {
  lead:
    'The pooled Other group fits a broad, medically weighted slice: unit quantities skew low while item budgets and contract amounts still spike into high tiers, modes mix small-value with public bidding, notices are mostly awarded, categories stay supply- and lab-heavy, and regions still lean on NCR / Metro Manila.',
  rows: [
    {
      evidence: 'Quantity',
      pattern: 'Low dominates',
      interpretation: 'Many records are not high-volume by unit count.',
    },
    {
      evidence: 'Item Budget',
      pattern: 'High and Very High dominate',
      interpretation: 'Some records involve costly items.',
    },
    {
      evidence: 'Contract Amount',
      pattern: 'Medium and Very High dominate',
      interpretation: 'Mixed financial scale.',
    },
    {
      evidence: 'Procurement Mode',
      pattern: 'Small Value Procurement and Public Bidding dominate',
      interpretation: 'Mix of routine and formal procurement methods.',
    },
    {
      evidence: 'Bid Notice Status',
      pattern: 'Awarded dominates',
      interpretation: 'Most records are completed procurement outcomes.',
    },
    {
      evidence: 'Business Category',
      pattern: 'Medical supplies, drugs, and lab-related items dominate',
      interpretation: 'Strong medical-related identity.',
    },
    {
      evidence: 'Region / Awardee Location',
      pattern: 'NCR and Metro Manila dominate',
      interpretation: 'Continued centralization of procurement and supplier activity.',
    },
  ],
}

/** Optional “Highlights & policy relevance” for DBSCAN insight cards (K‑means-style third collapsible). */
const DBSCAN_HIGHLIGHTS_NARRATIVE_BY_CLUSTER: Partial<
  Record<(typeof DBSCAN_INSIGHT_IDS)[number], string[]>
> = {
  0: [
    'Cluster 0 shows a concentrated procurement pattern involving medical-related items connected strongly to NCR and Metro Manila. It appears to represent a focused group of medium-to-high value procurement records, mostly from one major public health institution. This cluster can help identify institution-specific procurement behavior and supplier concentration.',
    'This cluster can help decision-makers monitor institution-centered procurement patterns. Since one agency strongly dominates the cluster, it can support review of procurement concentration, supplier dependence, and whether similar procurement behavior appears in other public health institutions.',
  ],
  119: [
    'Cluster 119 represents routine small-value procurement of medical-related items. It may include common supplies or support items purchased in higher quantities but at lower cost. This cluster is useful for understanding regular procurement activity that supports day-to-day public health operations.',
    'This cluster can support routine supply planning and small-value procurement monitoring. By identifying common low-cost purchases, public health agencies can improve replenishment planning and reduce repeated small procurement inefficiencies.',
  ],
  25: [
    'Cluster 25 represents emergency-related procurement records with high quantities and relatively fast award processing. The cluster appears to capture urgent procurement behavior for medical-related items such as drugs, medicines, medical supplies, and laboratory materials.',
    'This cluster can help the Philippines review emergency procurement behavior. It can support analysis of how urgent purchases were handled, whether emergency procurement was processed quickly, and which medical-related items were most involved during high-demand periods.',
  ],
  26: [
    'Cluster 26 captures high-value and high-volume emergency procurement. It may involve important medical-related supplies that required urgent purchasing and large financial allocation. Although award decision and publication were relatively fast, the high time-to-close pattern suggests that completion timelines still need closer review.',
    'This cluster can help agencies monitor critical emergency procurement packages. Because the records are both high-value and high-volume, this cluster can support review of procurement completion time, supplier readiness, and whether urgent purchases were completed efficiently.',
  ],
  27: [
    'Cluster 27 appears to capture active public bidding records for medical-related procurement. It represents formal procurement activities that may still require monitoring because the bid status is active and the time-to-close pattern is high.',
    'This cluster can help procurement offices monitor ongoing or active procurement activities. It can support early review of public bidding records that may need follow-up before delays affect medical-related supply availability.',
  ],
  [-1]: [
    'The Noise group represents procurement records that do not follow the most common dense DBSCAN patterns. These records should not be ignored because they may contain unusual procurement behavior, extreme values, delay-heavy records, or less common combinations of budget, quantity, mode, and location.',
    'The Noise group is useful for outlier monitoring and further investigation. It can help procurement analysts identify records that may need manual review, especially if they involve high budgets, large quantities, or long processing delays.',
  ],
}

const DBSCAN_HIGHLIGHTS_BOLD_PHRASES_BY_CLUSTER: Partial<
  Record<(typeof DBSCAN_INSIGHT_IDS)[number], Partial<Record<number, string[]>>>
> = {}

/** Optional extra narrative (e.g. policy / decision-maker use) — per-cluster collapsible. */
const CLUSTER_HIGHLIGHTS_NARRATIVE_BY_CLUSTER: Partial<Record<number, string[]>> = {
  0: [
    'Cluster 0 highlights major medical-related procurement spending that is concentrated in NCR and Luzon. These records are mostly awarded through public bidding and involve very high contract amounts. The low quantity pattern suggests that the cluster may include expensive medical equipment, laboratory instruments, or bundled procurement lots rather than bulk low-cost supplies.',
    'Cluster 0 can help Philippine public health decision-makers monitor high-value procurement activities. Since large-value contracts can have a major impact on public health supply readiness, this cluster can guide closer review of procurement timelines, supplier concentration, budget allocation, and regional procurement balance.',
  ],
  1: [
    'Cluster 1 shows routine procurement of medical-related items that are commonly needed in public health operations. The high quantity but low contract value pattern suggests that this cluster may involve frequently used supplies or consumables that require regular replenishment.',
    'Cluster 1 can help improve routine supply planning. By identifying high-quantity, low-cost procurement patterns, agencies can better plan replenishment cycles, reduce repeated small procurement inefficiencies, and ensure that common medical supplies remain available across public health facilities.',
  ],
  2: [
    'Cluster 2 highlights procurement records where the main concern is not the highest cost or highest quantity, but longer processing time. The very high award decision lag suggests that this cluster may contain procurement activities that require closer review for administrative or procedural delays.',
    'Cluster 2 can support procurement timeline monitoring. By identifying records with longer decision and publication delays, agencies can review bottlenecks, improve procurement scheduling, and reduce the risk that delayed procurement affects the timely availability of medical-related supplies.',
  ],
  3: [
    'Cluster 3 can be treated as a relatively stable procurement segment. It contains mostly awarded records, lower closing delays, and routine medical-related items. This makes it useful as a comparison point for other clusters that show stronger delays, high-value concentration, or high-volume procurement behavior.',
    'Cluster 3 can serve as a baseline procurement pattern. Public health agencies can compare other clusters against this more stable group to identify which procurement conditions are associated with smoother processing and better workflow consistency.',
  ],
  4: [
    'Cluster 4 represents large-scale medical-related procurement with high quantities, high budgets, and longer processing times. It may involve major procurement packages for drugs, medicines, medical equipment, and medical supplies. Because these records are both high-volume and high-value, delays in this cluster may have a greater effect on supply readiness.',
    'Cluster 4 can help prioritize monitoring of large and potentially critical procurement activities. Since it contains high-volume and high-budget records, public health agencies can use this cluster to review procurement delays, supplier readiness, and allocation planning for major medical-related supply needs.',
  ],
  5: [
    'Cluster 5 represents bulk medical-related procurement where many items are purchased in large quantities but at low to medium financial value. This may reflect frequently needed supplies, consumables, or medicines. Although the items may be lower in cost, delays in bulk procurement may still affect supply readiness because many units are involved.',
    'Cluster 5 can support bulk procurement planning. By identifying high-volume but lower-cost procurement patterns, agencies can improve forecasting, schedule routine bulk purchases earlier, and reduce the risk of delayed replenishment for commonly used medical-related supplies.',
  ],
}

/** Per-cluster, per-paragraph phrases bolded inside “Highlights & policy relevance” (paragraph index 0-based). */
const CLUSTER_HIGHLIGHTS_BOLD_PHRASES_BY_CLUSTER: Partial<
  Record<number, Partial<Record<number, string[]>>>
> = {
  2: {
    0: ['longer processing time.'],
    1: ['procurement timeline monitoring.'],
  },
  3: {
    1: ['baseline procurement pattern.'],
  },
  4: {
    1: ['large and potentially critical procurement activities.'],
  },
  5: {
    1: ['bulk procurement planning.'],
  },
}

/** Substrings to emphasize inside the semantic “Summary” collapsible (per cluster). */
const SEMANTIC_SUMMARY_BOLD_PHRASES_BY_CLUSTER: Partial<Record<number, string[]>> = {
  0: [
    'very high contract value',
    'very high item budget',
    'high approved budget',
    'Luzon, NCR, and Metro Manila',
    'awarded',
    'public bidding',
    'quantity is mostly low',
  ],
  1: [
    'Medical Equipment and Accessories and Supplies',
    'Drugs and Pharmaceutical Products',
    'contract amount, item budget, and approved budget are mostly low',
    'Small Value Procurement',
    'quantity is high',
    'Public Bidding',
  ],
  5: [
    'low to medium contract amount',
    'low to medium item budget',
    'very high and high quantity',
  ],
}

function textWithBoldPhrases(text: string, phrases: string[]): ReactNode {
  const list = [...phrases].filter((p) => p.length > 0).sort((a, b) => b.length - a.length)
  if (list.length === 0) return text

  const out: ReactNode[] = []
  let i = 0
  let key = 0
  while (i < text.length) {
    let best: { start: number; end: number; str: string } | null = null
    for (const p of list) {
      const j = text.indexOf(p, i)
      if (j < 0) continue
      if (
        best === null ||
        j < best.start ||
        (j === best.start && p.length > best.str.length)
      ) {
        best = { start: j, end: j + p.length, str: p }
      }
    }
    if (best === null) {
      out.push(text.slice(i))
      break
    }
    if (best.start > i) out.push(text.slice(i, best.start))
    out.push(
      <strong key={`sb${key++}`} className="font-bold text-mf-ink">
        {best.str}
      </strong>,
    )
    i = best.end
  }
  return <>{out}</>
}

function leadWithOptionalBold(lead: string, boldPhrase?: string): ReactNode {
  if (!boldPhrase) return lead
  const i = lead.indexOf(boldPhrase)
  if (i < 0) return lead
  return (
    <>
      {lead.slice(0, i)}
      <strong className="font-bold text-mf-ink">{boldPhrase}</strong>
      {lead.slice(i + boldPhrase.length)}
    </>
  )
}

function LabelFitEvidenceTable({ lead, leadBoldPhrase, rows }: LabelFitEvidence) {
  return (
    <div className="mt-2 space-y-3 text-xs">
      <div>
        <p className="font-semibold text-mf-ink">Why This Label Fits</p>
        <p className="mt-1.5 leading-relaxed text-mf-muted">{leadWithOptionalBold(lead, leadBoldPhrase)}</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-100 bg-slate-50/90">
        <table className="w-full min-w-[16rem] text-left text-[11px] text-mf-ink">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-2 py-1.5 font-bold text-mf-ink">Evidence Column</th>
              <th className="px-2 py-1.5 font-bold text-mf-ink">Strongest Pattern Seen</th>
              <th className="px-2 py-1.5 font-bold text-mf-ink">Interpretation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.evidence}>
                <td className="px-2 py-1.5 align-top text-mf-muted">{r.evidence}</td>
                <td className="px-2 py-1.5 align-top text-mf-ink">{r.pattern}</td>
                <td className="px-2 py-1.5 align-top leading-snug text-mf-muted">{r.interpretation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SemanticCollapsible({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group mt-2">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-mf-primary outline-none marker:content-none [&::-webkit-details-marker]:hidden">
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
        {title}
      </summary>
      {children}
    </details>
  )
}

function formatShareUnit(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(1)}%`
}

function formatLiftShort(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return '—'
  return `${n.toFixed(2)}×`
}

/** Grid card: pooled DBSCAN policy evidence under Policy_Evidence/cluster_other (summary JSON). */
function DbscanClusterOtherInsightCard() {
  const [rows, setRows] = useState<DbscanPolicyClusterOtherSummary[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const results = await Promise.all(
          DBSCAN_POLICY_CLUSTER_OTHER_SUMMARY_FILES.map((f) =>
            fetch(`${DBSCAN_POLICY_CLUSTER_OTHER_ROOT}/${f}`).then((res) => {
              if (!res.ok) throw new Error(f)
              return res.json() as Promise<DbscanPolicyClusterOtherSummary>
            }),
          ),
        )
        if (!cancelled) setRows(results)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-mf-caption font-semibold uppercase tracking-wide text-mf-primary">
        Other clusters (pooled)
      </p>
      <p className="mt-1 font-medium text-mf-ink">Broad Mixed Medical Procurement Segment</p>
      <SemanticCollapsible title="Summary">
        <div className="mt-2 space-y-2 text-xs leading-relaxed text-mf-muted">
          <p>
            The &quot;Other&quot; group represents many smaller DBSCAN clusters pooled together. Because these records
            come from multiple minor clusters, the pattern is broader and more mixed than the individually named
            clusters.
          </p>
          <p>
            This group shows strong representation of medical equipment and accessories, drugs and pharmaceutical
            products, laboratory supplies, and medical supplies. It has mostly low quantity, but the item budget and
            contract amount are often high or very high. Procurement mode is mostly Small Value Procurement and Public
            Bidding, while the bid notice status is mostly Awarded.
          </p>
          <p>
            The group is still concentrated in Luzon, NCR, and Metro Manila, but it also includes wider regional
            activity.
          </p>
        </div>
      </SemanticCollapsible>
      <SemanticCollapsible title="Why This Label Fits">
        <LabelFitEvidenceTable {...DBSCAN_CLUSTER_OTHER_LABEL_FIT} />
      </SemanticCollapsible>
      <SemanticCollapsible title="Top category by dimension">
        {loading ? (
          <p className="mt-2 text-xs text-mf-muted">Loading summaries…</p>
        ) : error ? (
          <p className="mt-2 text-xs text-red-600">Could not load summaries ({error}).</p>
        ) : rows && rows.length > 0 ? (
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-100 bg-slate-50/90">
            <table className="w-full min-w-[16rem] text-left text-[11px] text-mf-ink">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-2 py-1.5 font-semibold text-mf-ink">Dimension</th>
                  <th className="px-2 py-1.5 font-semibold text-mf-ink">Top value</th>
                  <th className="px-2 py-1.5 font-semibold tabular-nums text-mf-ink">Share</th>
                  <th className="px-2 py-1.5 font-semibold tabular-nums text-mf-ink">Lift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <tr key={`${r.logical_column ?? r.column_name ?? i}`}>
                    <td className="px-2 py-1 align-top text-mf-muted">
                      {r.logical_column ?? r.column_name ?? '—'}
                    </td>
                    <td className="max-w-[11rem] px-2 py-1 align-top leading-snug text-mf-ink">
                      {r.top_value ?? '—'}
                    </td>
                    <td className="px-2 py-1 align-top tabular-nums text-mf-muted">
                      {formatShareUnit(r.top_share_within_cluster)}
                    </td>
                    <td className="px-2 py-1 align-top tabular-nums text-mf-muted">
                      {formatLiftShort(r.lift_vs_global)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-xs text-mf-muted">No summary rows.</p>
        )}
      </SemanticCollapsible>
      <SemanticCollapsible title="Counts and outputs">
        <div className="mt-2 space-y-2 text-xs leading-relaxed text-mf-muted">
          <p>
            The Other Minor DBSCAN Clusters group captures mixed procurement records that do not belong to the main
            named DBSCAN clusters but still form smaller dense groups. These records show varied procurement behavior,
            including high-value items, routine procurement, and formal bidding activities.
          </p>
          <p>
            This group helps avoid ignoring smaller but meaningful procurement patterns. It gives decision-makers a
            broader view of minor procurement behaviors that may not dominate the dataset but can still reveal useful
            signals about regional concentration, procurement value, and item types.
          </p>
          <p>
            Each dimension also has companion{' '}
            <span className="font-mono text-[11px]">evidence_*_counts.csv</span> in{' '}
            <span className="font-mono text-[11px]">
              results/06B/Cluster_Interpretation/Policy_Evidence/cluster_other
            </span>
            , and bar chart PNGs can be added and wired like K‑means policy evidence if your pipeline generates them.
          </p>
        </div>
      </SemanticCollapsible>
    </article>
  )
}

function isCarouselDragExemptTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return (
    target.closest(
      'button,a,input,textarea,select,summary,label,[role="button"],[contenteditable="true"]',
    ) !== null
  )
}

/** Horizontal pages: every page is a `sm:grid-cols-2 xl:grid-cols-3` grid (not single-card slides). */
function DbscanInsightsGridPageCarousel({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter((node) => node != null)
  const pages: ReactNode[][] = []
  for (let i = 0; i < items.length; i += DBSCAN_INSIGHT_GRID_PAGE_SIZE) {
    pages.push(items.slice(i, i + DBSCAN_INSIGHT_GRID_PAGE_SIZE))
  }

  const scrollerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; x: number; scroll: number } | null>(null)
  const [grabbing, setGrabbing] = useState(false)
  const [activePage, setActivePage] = useState(0)
  const pageCount = pages.length

  const endDrag = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current
      const el = scrollerRef.current
      if (!d || !el || e.pointerId !== d.pointerId) return
      dragRef.current = null
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      setGrabbing(false)
      if (pageCount > 1) {
        const w = el.clientWidth
        const nearest = Math.round(el.scrollLeft / w)
        const clamped = Math.max(0, Math.min(pageCount - 1, nearest))
        el.scrollTo({ left: clamped * w, behavior: 'smooth' })
      }
    },
    [pageCount],
  )

  const onScrollerPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    if (e.button !== 0) return
    if (isCarouselDragExemptTarget(e.target)) return
    const el = scrollerRef.current
    if (!el) return
    dragRef.current = { pointerId: e.pointerId, x: e.clientX, scroll: el.scrollLeft }
    el.setPointerCapture(e.pointerId)
    setGrabbing(true)
  }

  const onScrollerPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    const el = scrollerRef.current
    if (!d || !el || e.pointerId !== d.pointerId) return
    el.scrollLeft = d.scroll - (e.clientX - d.x)
  }

  const syncPage = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const w = el.clientWidth
    if (w <= 0) return
    const i = Math.round(el.scrollLeft / w)
    setActivePage(Math.max(0, Math.min(pageCount - 1, i)))
  }, [pageCount])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    syncPage()
    el.addEventListener('scroll', syncPage, { passive: true })
    const ro = new ResizeObserver(syncPage)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', syncPage)
      ro.disconnect()
    }
  }, [syncPage, pages.length])

  const goPage = (delta: number) => {
    const el = scrollerRef.current
    if (!el || pageCount <= 1) return
    const w = el.clientWidth
    const i = Math.round(el.scrollLeft / w)
    const next = Math.max(0, Math.min(pageCount - 1, i + delta))
    el.scrollTo({ left: next * w, behavior: 'smooth' })
  }

  const goToPage = (index: number) => {
    const el = scrollerRef.current
    if (!el || pageCount <= 1) return
    const w = el.clientWidth
    const clamped = Math.max(0, Math.min(pageCount - 1, index))
    el.scrollTo({ left: clamped * w, behavior: 'smooth' })
  }

  if (pages.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-1 sm:gap-2">
        <button
          type="button"
          aria-label="Previous page of DBSCAN cards"
          onClick={() => goPage(-1)}
          disabled={activePage <= 0 || pageCount <= 1}
          className="hidden h-auto shrink-0 self-center rounded-full border border-slate-200 bg-white p-2 text-mf-primary shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <div
          ref={scrollerRef}
          onPointerDown={onScrollerPointerDown}
          onPointerMove={onScrollerPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={() => {
            dragRef.current = null
            setGrabbing(false)
          }}
          className={`flex min-w-0 flex-1 touch-pan-x snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${grabbing ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        >
          {pages.map((pageItems, pageIdx) => (
            <div
              key={`dbscan-grid-page-${pageIdx}`}
              className="box-border w-full min-w-full shrink-0 snap-center snap-always basis-full px-0.5 sm:px-1"
            >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{pageItems}</div>
            </div>
          ))}
        </div>
        <button
          type="button"
          aria-label="Next page of DBSCAN cards"
          onClick={() => goPage(1)}
          disabled={activePage >= pageCount - 1 || pageCount <= 1}
          className="hidden h-auto shrink-0 self-center rounded-full border border-slate-200 bg-white p-2 text-mf-primary shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
      {pageCount > 1 ? (
        <nav aria-label="DBSCAN insight pages" className="flex flex-wrap justify-center gap-2 py-1">
          {pages.map((_, i) => (
            <button
              key={`dbscan-page-dot-${i}`}
              type="button"
              onClick={() => goToPage(i)}
              aria-label={`Page ${i + 1} of ${pageCount}`}
              aria-current={activePage === i ? 'true' : undefined}
              className={`rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-mf-primary focus-visible:ring-offset-2 ${
                activePage === i
                  ? 'h-2.5 w-2.5 scale-110 bg-mf-primary'
                  : 'h-2 w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
              }}`}
            />
          ))}
        </nav>
      ) : null}
      <p className="text-center text-xs text-mf-muted">
        Page {activePage + 1} of {pageCount} — use dots, arrows, or hold-drag (swipe on touch).
      </p>
    </div>
  )
}

export function Interpretation() {
  const { data: semanticRows, loading: semanticLoading } = useCsvData(DATA_PATHS.clusterSemanticMap)
  const { data: themeRows, loading: themeLoading } = useCsvData(DATA_PATHS.clusterThemeProfiles)
  const { data: dbscanSemanticRows, loading: dbscanSemanticLoading } = useCsvData(DATA_PATHS.dbscanSemanticMap)
  const { data: dbscanThemeRows, loading: dbscanThemeLoading } = useCsvData(DATA_PATHS.dbscanThemeProfiles)
  const [policyCluster, setPolicyCluster] = useState<(typeof POLICY_CLUSTER_IDS)[number]>(0)
  const [dbscanPolicyFolder, setDbscanPolicyFolder] = useState<
    (typeof DBSCAN_POLICY_EVIDENCE_TABS)[number]['folder']
  >('cluster_0')
  const [lightbox, setLightbox] = useState<{ open: boolean; idx: number; imgs: GalleryImage[] }>({
    open: false,
    idx: 0,
    imgs: [],
  })

  const policyClusterGallery = useMemo(() => policyGalleryForCluster(policyCluster), [policyCluster])

  const dbscanPolicyClusterGallery = useMemo(() => {
    const tab = DBSCAN_POLICY_EVIDENCE_TABS.find((t) => t.folder === dbscanPolicyFolder)
    const label = tab?.label ?? 'Cluster 0'
    return policyGalleryForDbscanPolicyFolder(dbscanPolicyFolder, label)
  }, [dbscanPolicyFolder])

  const semanticById = useMemo(() => {
    const m = new Map<string, { label: string; rationale: string }>()
    for (const row of semanticRows) {
      const id = row.cluster_id?.trim()
      if (id === undefined || id === '') continue
      m.set(id, {
        label: row.cluster_label ?? '',
        rationale: row.rationale_short ?? '',
      })
    }
    return m
  }, [semanticRows])

  const themeByClusterId = useMemo(() => {
    const m = new Map<string, Record<string, string>>()
    for (const row of themeRows) {
      const id = row.cluster_id?.trim()
      if (id === undefined || id === '') continue
      m.set(id, row)
    }
    return m
  }, [themeRows])

  const tabularByClusterId = useMemo(() => {
    const m = new Map<number, { label: string; value: string }[]>()
    for (const id of POLICY_CLUSTER_IDS) {
      const rows = tabularThemeMetrics(themeByClusterId.get(String(id)))
      if (rows.length > 0) m.set(id, rows)
    }
    return m
  }, [themeByClusterId])

  const dbscanSemanticById = useMemo(() => {
    const m = new Map<string, { label: string; rationale: string }>()
    for (const row of dbscanSemanticRows) {
      const id = row.cluster_id?.trim()
      if (id === undefined || id === '') continue
      m.set(id, {
        label: row.cluster_label ?? '',
        rationale: row.rationale_short ?? '',
      })
    }
    return m
  }, [dbscanSemanticRows])

  const dbscanThemeByClusterId = useMemo(() => {
    const m = new Map<string, Record<string, string>>()
    for (const row of dbscanThemeRows) {
      const id = row.cluster_id?.trim()
      if (id === undefined || id === '') continue
      m.set(id, row)
    }
    return m
  }, [dbscanThemeRows])

  const dbscanTabularByClusterId = useMemo(() => {
    const m = new Map<number, { label: string; value: string }[]>()
    for (const id of DBSCAN_INSIGHT_IDS) {
      const rows = tabularThemeMetrics(dbscanThemeByClusterId.get(String(id)))
      if (rows.length > 0) m.set(id, rows)
    }
    return m
  }, [dbscanThemeByClusterId])

  return (
    <PageShell>
      <LightboxGallery
        images={lightbox.imgs}
        index={lightbox.idx}
        open={lightbox.open}
        onClose={() => setLightbox((s) => ({ ...s, open: false }))}
      />

      <div className="flex gap-8">
        <div className="min-w-0 flex-1 space-y-14 overflow-x-hidden">
          <SectionWrapper id="interpretation-overview">
            <SectionHeader
              title="Cluster Interpretation"
              icon={BookOpen}
            />
          </SectionWrapper>

          <SectionWrapper id="interpretation-section-kmeans">
            <LazyIframePanel
              id="interpretation-kmeans-3d"
              src={INTERACTIVE.kmeans3d}
              title="Interactive 3D K‑Means PCA space"
              height={600}
            />

            <SectionWrapper id="interpretation-labels">
            <SectionHeader
              title="Cluster Insights & Interpretation (K‑Means)"
              icon={MapPin}
            />

            <div className="mb-8 space-y-3">
              <h3 className="text-mf-card-title font-semibold text-mf-ink">K-means</h3>
              {semanticLoading ? (
                <p className="text-mf-body text-mf-muted">Loading cluster labels…</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {POLICY_CLUSTER_IDS.map((id) => {
                    const meta = semanticById.get(String(id))
                    const tabularRows = tabularByClusterId.get(id)
                    const labelFit = LABEL_FIT_EVIDENCE_BY_CLUSTER[id]
                    const highlightsParagraphs = CLUSTER_HIGHLIGHTS_NARRATIVE_BY_CLUSTER[id]
                    const highlightsBoldByPara = CLUSTER_HIGHLIGHTS_BOLD_PHRASES_BY_CLUSTER[id]
                    const summaryBoldPhrases = SEMANTIC_SUMMARY_BOLD_PHRASES_BY_CLUSTER[id]
                    return (
                      <article
                        key={id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <p className="text-mf-caption font-semibold uppercase tracking-wide text-mf-primary">
                          Cluster {id}
                        </p>
                        <p className="mt-1 font-medium text-mf-ink">{meta?.label ?? '—'}</p>
                        {meta?.rationale ? (
                          <SemanticCollapsible title="Summary">
                            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-mf-muted">
                              {summaryBoldPhrases?.length
                                ? textWithBoldPhrases(semanticRationaleBody(meta.rationale), summaryBoldPhrases)
                                : semanticRationaleBody(meta.rationale)}
                            </p>
                          </SemanticCollapsible>
                        ) : null}
                        {labelFit ? (
                          <SemanticCollapsible title="Why This Label Fits">
                            <LabelFitEvidenceTable {...labelFit} />
                          </SemanticCollapsible>
                        ) : !themeLoading && tabularRows && tabularRows.length > 0 ? (
                          <SemanticCollapsible title="Tabulated metrics">
                            <div className="mt-2 overflow-x-auto rounded-lg border border-slate-100 bg-slate-50/90">
                              <table className="w-full min-w-[12rem] text-left text-[11px] text-mf-ink">
                                <thead>
                                  <tr className="border-b border-slate-200 text-mf-muted">
                                    <th className="px-2 py-1.5 font-semibold">Metric</th>
                                    <th className="px-2 py-1.5 font-semibold tabular-nums">Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {tabularRows.map((r) => (
                                    <tr key={r.label}>
                                      <td className="px-2 py-1 text-mf-muted">{r.label}</td>
                                      <td className="px-2 py-1 tabular-nums text-mf-ink">{r.value}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </SemanticCollapsible>
                        ) : null}
                        {highlightsParagraphs && highlightsParagraphs.length > 0 ? (
                          <SemanticCollapsible title="Highlights & policy relevance">
                            <div className="mt-2 space-y-2 text-xs leading-relaxed text-mf-muted">
                              {highlightsParagraphs.map((para, i) => (
                                <p key={i}>
                                  {highlightsBoldByPara?.[i]?.length
                                    ? textWithBoldPhrases(para, highlightsBoldByPara[i]!)
                                    : para}
                                </p>
                              ))}
                            </div>
                          </SemanticCollapsible>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-14 border-t border-slate-200 pt-14 dark:border-border">
              <SectionWrapper id="interpretation-cluster-summary">
                <SectionHeader
                  title="Overall cluster summary (K‑Means)"
                  icon={LayoutGrid}
                />

                <div className="space-y-3">
                  <p className="text-mf-body leading-relaxed text-mf-muted">
                    The six clusters show that medical-related procurement behavior is not uniform. Each cluster
                    captures a different procurement pattern, such as high-value centralized procurement, routine
                    high-quantity supply procurement, delayed medium-value procurement, stable routine procurement,
                    high-volume high-budget procurement, and bulk low-to-medium cost procurement.
                  </p>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-slate-50 text-mf-muted">
                        <tr>
                          <th className="px-3 py-2 font-semibold whitespace-nowrap">Cluster</th>
                          <th className="px-3 py-2 font-semibold">Suggested label</th>
                          <th className="px-3 py-2 font-semibold">Main meaning</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-mf-ink">
                        {OVERALL_CLUSTER_SUMMARY_ROWS.map((r) => (
                          <tr key={r.cluster} className="odd:bg-white even:bg-slate-50/60">
                            <td className="px-3 py-2 font-medium whitespace-nowrap tabular-nums">
                              Cluster {r.cluster}
                            </td>
                            <td className="px-3 py-2 font-medium">{r.label}</td>
                            <td className="px-3 py-2 leading-snug text-mf-muted">{r.meaning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionWrapper>
            </div>

            <div className="mt-14 border-t border-slate-200 pt-14 dark:border-border">
              <SectionWrapper id="interpretation-overall-conclusion">
                <SectionHeader
                  title="Overall conclusion (K‑Means)"
                  icon={Flag}
                />

                <div className="space-y-3">
                  <p className="text-mf-body leading-relaxed text-mf-muted">
                    The cluster results provide useful insights for understanding medical-related procurement
                    behavior in the Philippine public health context. The clusters do not directly prove actual
                    shortages, overstocking, or supply failure. However, they provide strong analytical signals that
                    can guide further review.
                  </p>
                  <p className="text-mf-body font-medium text-mf-ink">For the Philippines, these clusters can support:</p>
                  <ul className="list-disc space-y-1.5 pl-5 text-mf-body leading-relaxed text-mf-muted">
                    {OVERALL_CONCLUSION_USES.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="text-mf-body leading-relaxed text-mf-muted">
                    Overall, the cluster interpretations help stakeholders understand where procurement activity is
                    concentrated, which procurement groups may require closer monitoring, and how different
                    medical-related procurement behaviors may affect public health supply planning.
                  </p>
                </div>
              </SectionWrapper>
            </div>
          </SectionWrapper>

          <SectionWrapper id="interpretation-policy">
            <SectionHeader
              title="Evidence(K-Means)"
              subtitle="Policy Evidence: Per‑cluster distributions for procurement dimensions."
              icon={Scale}
            />

            <div className="mb-4 flex flex-wrap gap-2">
              {POLICY_CLUSTER_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPolicyCluster(id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    policyCluster === id
                      ? 'border-mf-primary bg-mf-primary text-white'
                      : 'border-slate-200 bg-white text-mf-muted hover:border-slate-300'
                  }`}
                >
                  Cluster {id}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {policyClusterGallery.map((img, idx) => (
                <ImageCard
                  key={img.src}
                  src={img.src}
                  title={img.title}
                  onClick={() =>
                    setLightbox({
                      open: true,
                      idx,
                      imgs: [...policyClusterGallery],
                    })
                  }
                />
              ))}
            </div>
          </SectionWrapper>
          </SectionWrapper>

          <SectionWrapper id="interpretation-section-dbscan">
            <LazyIframePanel
              id="interpretation-dbscan-3d"
              src={INTERACTIVE.dbscan3d}
              title="Interactive 3D DBSCAN PCA space"
              height={600}
            />

            <SectionWrapper id="interpretation-dbscan-insights">
            <SectionHeader
              title="Cluster Insights & Interpretation (DBSCAN)"
              icon={MapPin}
            />
            <div className="space-y-3">
              <h3 className="text-mf-card-title font-semibold text-mf-ink">DBSCAN</h3>
              {dbscanSemanticLoading ? (
                <p className="text-mf-body text-mf-muted">Loading DBSCAN cluster labels…</p>
              ) : null}
              <DbscanInsightsGridPageCarousel>
                {!dbscanSemanticLoading
                  ? DBSCAN_INSIGHT_IDS.map((id) => {
                    const meta = dbscanSemanticById.get(String(id))
                    const tabularRows = dbscanTabularByClusterId.get(id)
                    const dbscanLabelFit = DBSCAN_LABEL_FIT_EVIDENCE_BY_CLUSTER[id]
                    const dbscanHighlightsParagraphs = DBSCAN_HIGHLIGHTS_NARRATIVE_BY_CLUSTER[id]
                    const dbscanHighlightsBoldByPara = DBSCAN_HIGHLIGHTS_BOLD_PHRASES_BY_CLUSTER[id]
                    const cardKey = id === -1 ? 'dbscan-noise' : `dbscan-${id}`
                    const clusterTitle = id === -1 ? 'Noise' : `Cluster ${id}`
                    return (
                      <article
                        key={cardKey}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <p className="text-mf-caption font-semibold uppercase tracking-wide text-mf-primary">
                          {clusterTitle}
                        </p>
                        <p className="mt-1 font-medium text-mf-ink">{meta?.label ?? '—'}</p>
                        {meta?.rationale ? (
                          <SemanticCollapsible title="Summary">
                            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-mf-muted">
                              {semanticRationaleBody(meta.rationale)}
                            </p>
                          </SemanticCollapsible>
                        ) : null}
                        {dbscanLabelFit ? (
                          <SemanticCollapsible title="Why This Label Fits">
                            <LabelFitEvidenceTable {...dbscanLabelFit} />
                          </SemanticCollapsible>
                        ) : !dbscanThemeLoading && tabularRows && tabularRows.length > 0 ? (
                          <SemanticCollapsible title="Tabulated metrics">
                            <div className="mt-2 overflow-x-auto rounded-lg border border-slate-100 bg-slate-50/90">
                              <table className="w-full min-w-[12rem] text-left text-[11px] text-mf-ink">
                                <thead>
                                  <tr className="border-b border-slate-200 text-mf-muted">
                                    <th className="px-2 py-1.5 font-semibold">Metric</th>
                                    <th className="px-2 py-1.5 font-semibold tabular-nums">Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {tabularRows.map((r) => (
                                    <tr key={r.label}>
                                      <td className="px-2 py-1 text-mf-muted">{r.label}</td>
                                      <td className="px-2 py-1 tabular-nums text-mf-ink">{r.value}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </SemanticCollapsible>
                        ) : null}
                        {dbscanHighlightsParagraphs && dbscanHighlightsParagraphs.length > 0 ? (
                          <SemanticCollapsible title="Highlights & policy relevance">
                            <div className="mt-2 space-y-2 text-xs leading-relaxed text-mf-muted">
                              {dbscanHighlightsParagraphs.map((para, i) => (
                                <p key={i}>
                                  {dbscanHighlightsBoldByPara?.[i]?.length
                                    ? textWithBoldPhrases(para, dbscanHighlightsBoldByPara[i]!)
                                    : para}
                                </p>
                              ))}
                            </div>
                          </SemanticCollapsible>
                        ) : null}
                      </article>
                    )
                  })
                  : null}
                <DbscanClusterOtherInsightCard key="dbscan-cluster-other" />
              </DbscanInsightsGridPageCarousel>
            </div>

            <div className="mt-14 border-t border-slate-200 pt-14 dark:border-border">
              <SectionWrapper id="interpretation-dbscan-cluster-summary">
                <SectionHeader
                  title="Overall cluster summary (DBSCAN)"
                  icon={LayoutGrid}
                />

                <div className="space-y-3">
                  <p className="text-mf-body leading-relaxed text-mf-muted">
                    DBSCAN revealed several dense procurement behavior groups and one large set of
                    noise records. Compared with K-means, DBSCAN is more useful for identifying
                    density-based patterns, small specialized clusters, and outlier-like records.
                  </p>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-slate-50 text-mf-muted">
                        <tr>
                          <th className="px-3 py-2 font-semibold whitespace-nowrap">DBSCAN Group</th>
                          <th className="px-3 py-2 font-semibold">Suggested label</th>
                          <th className="px-3 py-2 font-semibold">Main meaning</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-mf-ink">
                        {DBSCAN_OVERALL_SUMMARY_ROWS.map((row) => (
                          <tr key={row.group} className="odd:bg-white even:bg-slate-50/60">
                            <td className="px-3 py-2 font-medium whitespace-nowrap">{row.group}</td>
                            <td className="px-3 py-2 font-medium">{row.label}</td>
                            <td className="px-3 py-2 leading-snug text-mf-muted">{row.meaning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionWrapper>
            </div>

            <div className="mt-14 border-t border-slate-200 pt-14 dark:border-border">
              <SectionWrapper id="interpretation-dbscan-overall-conclusion">
                <SectionHeader
                  title="Overall conclusion (DBSCAN)"
                  icon={Flag}
                />

                <div className="space-y-3">
                  <p className="text-mf-body leading-relaxed text-mf-muted">
                    The DBSCAN results provide a supporting view of medical-related procurement behavior
                    in the Philippines. While K-means gives the main six-cluster segmentation, DBSCAN
                    helps reveal smaller dense groups and records that behave differently from the
                    majority.
                  </p>
                  <p className="text-mf-body font-medium text-mf-ink">The main benefit of DBSCAN is its ability to identify:</p>
                  <ul className="list-disc space-y-1.5 pl-5 text-mf-body leading-relaxed text-mf-muted">
                    {DBSCAN_OVERALL_IDENTIFY_BULLETS.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="text-mf-body leading-relaxed text-mf-muted">
                    These results do not directly prove actual shortages, oversupply, or procurement
                    failure. However, they provide useful analytical signals for procurement
                    monitoring, delay review, supplier concentration analysis, and resource allocation
                    planning.
                  </p>
                  <p className="text-mf-body leading-relaxed text-mf-muted">
                    For the Philippines, the DBSCAN cluster insights can help public health
                    decision-makers identify which procurement records follow common dense patterns and
                    which records appear unusual or irregular. This can support better procurement
                    review, more targeted monitoring, and stronger evidence-based decision-support for
                    medical-related supply planning.
                  </p>
                </div>
              </SectionWrapper>
            </div>
          </SectionWrapper>

          </SectionWrapper>

          <SectionWrapper id="interpretation-policy-dbscan">
            <SectionHeader
              title="Evidences (DBSCAN)"
              subtitle="Policy Evidence: procurement dimension bar charts for DBSCAN clusters 0, 119, 25–27, noise, and pooled cluster_other."
              icon={Scale}
            />

            <div className="mb-4 flex flex-wrap gap-2">
              {DBSCAN_POLICY_EVIDENCE_TABS.map(({ folder, label }) => (
                <button
                  key={folder}
                  type="button"
                  onClick={() => setDbscanPolicyFolder(folder)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    dbscanPolicyFolder === folder
                      ? 'border-mf-primary bg-mf-primary text-white'
                      : 'border-slate-200 bg-white text-mf-muted hover:border-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dbscanPolicyClusterGallery.map((img, idx) => (
                <ImageCard
                  key={img.src}
                  src={img.src}
                  title={img.title}
                  onClick={() =>
                    setLightbox({
                      open: true,
                      idx,
                      imgs: [...dbscanPolicyClusterGallery],
                    })
                  }
                />
              ))}
            </div>
          </SectionWrapper>
        </div>

        <aside className="medflow-no-print hidden w-48 shrink-0 xl:block">
          <PageTOC sections={TOC_INTERPRETATION} />
        </aside>
      </div>
    </PageShell>
  )
}
