import React, { useMemo, useState } from "react";
import { FileText, AlertTriangle, Calculator, ClipboardList, Landmark } from "lucide-react";

const initialForm = {
  projectName: "",
  borrower: "",
  lender: "",
  builder: "",
  contractSum: "",
  totalApprovedBudget: "",
  previousCertified: "",
  currentClaim: "",
  approvedVariations: "",
  pendingVariations: "",
  contingencyRemaining: "",
  drawdownRequested: "",
  hardCostDrawdown: "",
  softCostDrawdown: "",
  cumulativeDrawdown: "",
  costToComplete: "",
  originalCompletionDate: "",
  revisedCompletionDate: "",
  qsComments: "",
};

function parseMoney(value) {
  const cleaned = String(value || "").replace(/[^0-9.-]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function daysBetween(date1, date2) {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const ms = d2 - d1;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function sectionStyle() {
  return {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 2px 10px rgba(15, 23, 42, 0.05)",
  };
}

function inputStyle() {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    boxSizing: "border-box",
  };
}

function buildRiskFlags(metrics) {
  const risks = [];

  if (metrics.claimAsPctOfContract > 12) {
    risks.push(
      "The current claim appears relatively high when compared with the overall contract sum and should be checked against actual site progress and any materials on site."
    );
  }

  if (metrics.pendingVariationPct > 3) {
    risks.push(
      "Pending variations are material relative to the contract sum and may place pressure on the final forecast cost if not resolved promptly."
    );
  }

  if (metrics.contingencyPct < 3) {
    risks.push(
      "The remaining contingency is tightening and may be insufficient if further latent conditions, design development or unresolved variation items arise."
    );
  }

  if (metrics.delayDays > 0) {
    risks.push(
      `The revised completion date is ${metrics.delayDays} days later than the original completion date, which indicates programme slippage that should continue to be monitored.`
    );
  }

  if (metrics.drawdownVariance !== 0) {
    risks.push(
      `The drawdown requested differs from the sum of the hard cost and soft cost drawdown entries by ${formatMoney(Math.abs(metrics.drawdownVariance))}. This should be reconciled before issue to the lender.`
    );
  }

  if (metrics.remainingFunding < metrics.costToComplete && metrics.totalApprovedBudget > 0) {
    risks.push(
      "The remaining undrawn funding appears lower than the reported cost to complete, which may indicate a potential funding shortfall and should be reviewed carefully."
    );
  }

  if (!risks.length) {
    risks.push(
      "No immediate material cost, funding or programme concerns are evident from the limited data entered, however the position remains subject to review of the supporting documents and actual site conditions."
    );
  }

  return risks;
}

function buildOverallRisk(metrics, risks) {
  if (metrics.remainingFunding < metrics.costToComplete && metrics.totalApprovedBudget > 0) {
    return { rating: "High", color: "#b91c1c", bg: "#fee2e2" };
  }

  if (metrics.contingencyPct < 3 || metrics.pendingVariationPct > 3 || metrics.delayDays > 14 || metrics.drawdownVariance !== 0) {
    return { rating: "Moderate", color: "#b45309", bg: "#fef3c7" };
  }

  return { rating: "Low", color: "#166534", bg: "#dcfce7" };
}

function buildReport(data, metrics, risks, overallRisk) {
  const totalCertifiedIncludingThisClaim = metrics.previousCertified + metrics.currentClaim;

  return `MONTHLY PROGRESS REPORT – DRAFT

Project: ${data.projectName || "[Project Name]"}
Borrower: ${data.borrower || "[Borrower]"}
Lender: ${data.lender || "[Lender]"}
Builder: ${data.builder || "[Builder]"}
Overall Risk Rating: ${overallRisk.rating}

1. Executive Summary
Based on the limited information currently entered into this tool, the works appear to be progressing generally in line with the reported financial and funding position, subject to review of the supporting claim documentation, programme details, variation status and site inspection findings. The current progress claim is ${formatMoney(metrics.currentClaim)} and the total certified value including this claim would be approximately ${formatMoney(totalCertifiedIncludingThisClaim)}, which represents ${formatPercent(metrics.certifiedPctOfContract)} of the stated contract sum.

2. Cost Status
The reported contract sum is ${formatMoney(metrics.contractSum)}. Approved variations entered total ${formatMoney(metrics.approvedVariations)}, while pending variations total ${formatMoney(metrics.pendingVariations)}. The remaining contingency allowance entered is ${formatMoney(metrics.contingencyRemaining)}, equivalent to ${formatPercent(metrics.contingencyPct)} of the contract sum. The reported cost to complete is ${formatMoney(metrics.costToComplete)}.

3. Drawdown Summary
The drawdown requested for the current period is ${formatMoney(metrics.drawdownRequested)}, comprising hard costs of ${formatMoney(metrics.hardCostDrawdown)} and soft costs of ${formatMoney(metrics.softCostDrawdown)}. The cumulative drawdown to date is reported as ${formatMoney(metrics.cumulativeDrawdown)}. Based on the total approved budget of ${formatMoney(metrics.totalApprovedBudget)}, the remaining undrawn balance is ${formatMoney(metrics.remainingFunding)}.

4. Programme Status
The original completion date entered is ${data.originalCompletionDate || "[Original Date]"} and the revised completion date is ${data.revisedCompletionDate || "[Revised Date]"}. The current reported movement equates to ${metrics.delayDays > 0 ? `${metrics.delayDays} days of delay` : metrics.delayDays < 0 ? `${Math.abs(metrics.delayDays)} days ahead of the original completion date` : "no net movement between the entered dates"}.

5. Key Risks and Matters to Monitor
${risks.map((risk, index) => `${index + 1}. ${risk}`).join("\n")}

6. QS Commentary
${data.qsComments || "[Insert project specific QS commentary here]"}

7. Draft Recommendation
Subject to verification of the claim against site progress, supporting documentation, approved variation status, drawdown reconciliation and any excluded or incomplete works, the current drawdown request appears capable of further assessment. At this stage, the reported remaining undrawn balance of ${formatMoney(metrics.remainingFunding)} is ${metrics.remainingFunding >= metrics.costToComplete ? "currently above" : "currently below"} the reported cost to complete of ${formatMoney(metrics.costToComplete)}. The recommended certification position should remain subject to normal QS review and final confirmation.
`;
}

export default function BankReportingMVP() {
  const [form, setForm] = useState(initialForm);
  const [copied, setCopied] = useState(false);

  const metrics = useMemo(() => {
    const contractSum = parseMoney(form.contractSum);
    const totalApprovedBudget = parseMoney(form.totalApprovedBudget);
    const previousCertified = parseMoney(form.previousCertified);
    const currentClaim = parseMoney(form.currentClaim);
    const approvedVariations = parseMoney(form.approvedVariations);
    const pendingVariations = parseMoney(form.pendingVariations);
    const contingencyRemaining = parseMoney(form.contingencyRemaining);
    const drawdownRequested = parseMoney(form.drawdownRequested);
    const hardCostDrawdown = parseMoney(form.hardCostDrawdown);
    const softCostDrawdown = parseMoney(form.softCostDrawdown);
    const cumulativeDrawdown = parseMoney(form.cumulativeDrawdown);
    const costToComplete = parseMoney(form.costToComplete);
    const totalCertified = previousCertified + currentClaim;
    const drawdownComponentsTotal = hardCostDrawdown + softCostDrawdown;

    return {
      contractSum,
      totalApprovedBudget,
      previousCertified,
      currentClaim,
      approvedVariations,
      pendingVariations,
      contingencyRemaining,
      drawdownRequested,
      hardCostDrawdown,
      softCostDrawdown,
      cumulativeDrawdown,
      costToComplete,
      totalCertified,
      drawdownComponentsTotal,
      certifiedPctOfContract: contractSum ? (totalCertified / contractSum) * 100 : 0,
      claimAsPctOfContract: contractSum ? (currentClaim / contractSum) * 100 : 0,
      pendingVariationPct: contractSum ? (pendingVariations / contractSum) * 100 : 0,
      contingencyPct: contractSum ? (contingencyRemaining / contractSum) * 100 : 0,
      remainingFunding: totalApprovedBudget ? totalApprovedBudget - cumulativeDrawdown : 0,
      drawdownVariance: drawdownRequested - drawdownComponentsTotal,
      delayDays: daysBetween(form.originalCompletionDate, form.revisedCompletionDate),
    };
  }, [form]);

  const risks = useMemo(() => buildRiskFlags(metrics), [metrics]);
  const overallRisk = useMemo(() => buildOverallRisk(metrics, risks), [metrics, risks]);
  const report = useMemo(() => buildReport(form, metrics, risks, overallRisk), [form, metrics, risks, overallRisk]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setCopied(false);
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setCopied(false);
  };

  const projectFields = [
    ["projectName", "Project Name"],
    ["borrower", "Borrower"],
    ["lender", "Lender"],
    ["builder", "Builder"],
    ["contractSum", "Contract Sum (AUD)"],
    ["totalApprovedBudget", "Total Approved Budget (AUD)"],
    ["previousCertified", "Previous Certified (AUD)"],
    ["currentClaim", "Current Claim (AUD)"],
    ["approvedVariations", "Approved Variations (AUD)"],
    ["pendingVariations", "Pending Variations (AUD)"],
    ["contingencyRemaining", "Contingency Remaining (AUD)"],
    ["originalCompletionDate", "Original Completion Date"],
    ["revisedCompletionDate", "Revised Completion Date"],
  ];

  const fundingFields = [
    ["drawdownRequested", "This Month Drawdown Requested (AUD)"],
    ["hardCostDrawdown", "Hard Cost Drawdown (AUD)"],
    ["softCostDrawdown", "Soft Cost Drawdown (AUD)"],
    ["cumulativeDrawdown", "Cumulative Drawdown to Date (AUD)"],
    ["costToComplete", "Cost to Complete (AUD)"],
  ];

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f8fafc",
      padding: 24,
      fontFamily: "Arial, sans-serif",
      color: "#0f172a",
    },
    container: {
      maxWidth: 1320,
      margin: "0 auto",
    },
    hero: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 20,
      padding: 24,
      boxShadow: "0 2px 10px rgba(15, 23, 42, 0.05)",
      marginBottom: 24,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1.35fr 0.9fr",
      gap: 24,
      alignItems: "start",
    },
    fieldGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
    },
    label: {
      display: "block",
      marginBottom: 6,
      fontSize: 14,
      fontWeight: 600,
    },
    buttonRow: {
      display: "flex",
      gap: 12,
      marginTop: 18,
      flexWrap: "wrap",
    },
    primaryButton: {
      background: "#0f172a",
      color: "#ffffff",
      border: "none",
      borderRadius: 10,
      padding: "10px 16px",
      cursor: "pointer",
      fontSize: 14,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
    },
    secondaryButton: {
      background: "#ffffff",
      color: "#0f172a",
      border: "1px solid #cbd5e1",
      borderRadius: 10,
      padding: "10px 16px",
      cursor: "pointer",
      fontSize: 14,
    },
    metricGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
    },
    metricCard: {
      background: "#f8fafc",
      borderRadius: 12,
      padding: 16,
      border: "1px solid #e2e8f0",
    },
    riskCard: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 14,
      fontSize: 14,
      lineHeight: 1.5,
      marginBottom: 10,
    },
    titleRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 14,
      fontSize: 20,
      fontWeight: 700,
    },
    textarea: {
      width: "100%",
      minHeight: 140,
      padding: 12,
      borderRadius: 10,
      border: "1px solid #cbd5e1",
      fontSize: 14,
      boxSizing: "border-box",
      resize: "vertical",
    },
    reportBox: {
      width: "100%",
      minHeight: 560,
      padding: 12,
      borderRadius: 12,
      border: "1px solid #cbd5e1",
      fontSize: 13,
      boxSizing: "border-box",
      fontFamily: "Consolas, monospace",
      resize: "vertical",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.hero}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 36 }}>Bank Reporting MVP – Phase 2A</h1>
              <p style={{ marginTop: 10, color: "#475569", maxWidth: 900, lineHeight: 1.5 }}>
                This version adds funding metrics for current drawdown, hard and soft costs, cumulative drawdown, cost to complete, remaining undrawn funding and a stronger lender-facing draft report.
              </p>
            </div>
            <div style={{ background: overallRisk.bg, color: overallRisk.color, borderRadius: 12, padding: "10px 14px", height: "fit-content", fontWeight: 700 }}>
              Overall Risk: {overallRisk.rating}
            </div>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={sectionStyle()}>
            <div style={styles.titleRow}>
              <ClipboardList size={20} />
              <span>Project Input Form</span>
            </div>

            <div style={{ marginBottom: 18, fontWeight: 700, color: "#334155" }}>Project and Cost Inputs</div>
            <div style={styles.fieldGrid}>
              {projectFields.map(([key, label]) => (
                <div key={key}>
                  <label style={styles.label}>{label}</label>
                  <input
                    type={key.toLowerCase().includes("date") ? "date" : "text"}
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={label}
                    style={inputStyle()}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, marginBottom: 18, fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: 8 }}>
              <Landmark size={18} />
              Funding and Drawdown Inputs
            </div>
            <div style={styles.fieldGrid}>
              {fundingFields.map(([key, label]) => (
                <div key={key}>
                  <label style={styles.label}>{label}</label>
                  <input
                    type="text"
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={label}
                    style={inputStyle()}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={styles.label}>QS Comments</label>
              <textarea
                value={form.qsComments}
                onChange={(e) => handleChange("qsComments", e.target.value)}
                placeholder="Insert project specific commentary, site observations, claim concerns, variation notes, funding comments, or lender comments"
                style={styles.textarea}
              />
            </div>

            <div style={styles.buttonRow}>
              <button onClick={copyReport} style={styles.primaryButton}>
                <FileText size={16} />
                {copied ? "Copied" : "Copy Draft Report"}
              </button>
              <button onClick={resetForm} style={styles.secondaryButton}>
                Reset Form
              </button>
            </div>
          </div>

          <div>
            <div style={{ ...sectionStyle(), marginBottom: 24 }}>
              <div style={styles.titleRow}>
                <Calculator size={20} />
                <span>Snapshot Metrics</span>
              </div>
              <div style={styles.metricGrid}>
                <div style={styles.metricCard}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Total Certified</div>
                  <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{formatMoney(metrics.totalCertified)}</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Certified % of Contract</div>
                  <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{formatPercent(metrics.certifiedPctOfContract)}</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>This Month Drawdown</div>
                  <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{formatMoney(metrics.drawdownRequested)}</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Cost to Complete</div>
                  <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{formatMoney(metrics.costToComplete)}</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Remaining Undrawn Funding</div>
                  <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{formatMoney(metrics.remainingFunding)}</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Drawdown Reconciliation Variance</div>
                  <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{formatMoney(metrics.drawdownVariance)}</div>
                </div>
              </div>
            </div>

            <div style={{ ...sectionStyle(), marginBottom: 24 }}>
              <div style={styles.titleRow}>
                <Landmark size={20} />
                <span>Drawdown Summary</span>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  ["Hard Cost Drawdown", formatMoney(metrics.hardCostDrawdown)],
                  ["Soft Cost Drawdown", formatMoney(metrics.softCostDrawdown)],
                  ["Total Requested Drawdown", formatMoney(metrics.drawdownRequested)],
                  ["Cumulative Drawdown", formatMoney(metrics.cumulativeDrawdown)],
                  ["Cost to Complete", formatMoney(metrics.costToComplete)],
                  ["Remaining Undrawn Balance", formatMoney(metrics.remainingFunding)],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 10, background: "#f8fafc" }}>
                    <span style={{ color: "#475569", fontSize: 14 }}>{label}</span>
                    <span style={{ fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={sectionStyle()}>
              <div style={styles.titleRow}>
                <AlertTriangle size={20} />
                <span>Auto Risk Flags</span>
              </div>
              {risks.map((risk, index) => (
                <div key={index} style={styles.riskCard}>{risk}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...sectionStyle(), marginTop: 24 }}>
          <div style={styles.titleRow}>Generated Draft Report</div>
          <textarea value={report} readOnly style={styles.reportBox} />
        </div>
      </div>
    </div>
  );
}
