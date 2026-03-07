import React, { useMemo, useState } from "react";
import { FileText, AlertTriangle, Calculator, ClipboardList } from "lucide-react";

const initialForm = {
  projectName: "",
  borrower: "",
  lender: "",
  builder: "",
  contractSum: "",
  previousCertified: "",
  currentClaim: "",
  approvedVariations: "",
  pendingVariations: "",
  contingencyRemaining: "",
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

  if (!risks.length) {
    risks.push(
      "No immediate material cost or programme concerns are evident from the limited data entered, however the position remains subject to review of the supporting documents and actual site conditions."
    );
  }

  return risks;
}

function buildReport(data, metrics, risks) {
  const totalCertifiedIncludingThisClaim = metrics.previousCertified + metrics.currentClaim;

  return `MONTHLY PROGRESS REPORT – DRAFT

Project: ${data.projectName || "[Project Name]"}
Borrower: ${data.borrower || "[Borrower]"}
Lender: ${data.lender || "[Lender]"}
Builder: ${data.builder || "[Builder]"}

1. Executive Summary
Based on the limited information currently entered into this tool, the works appear to be progressing generally in line with the reported financial position, subject to review of the supporting claim documentation, programme details, variation status and site inspection findings. The current progress claim is ${formatMoney(metrics.currentClaim)} and the total certified value including this claim would be approximately ${formatMoney(totalCertifiedIncludingThisClaim)}, which represents ${formatPercent(metrics.certifiedPctOfContract)} of the stated contract sum.

2. Cost Status
The reported contract sum is ${formatMoney(metrics.contractSum)}. Approved variations entered total ${formatMoney(metrics.approvedVariations)}, while pending variations total ${formatMoney(metrics.pendingVariations)}. The remaining contingency allowance entered is ${formatMoney(metrics.contingencyRemaining)}, equivalent to ${formatPercent(metrics.contingencyPct)} of the contract sum.

3. Programme Status
The original completion date entered is ${data.originalCompletionDate || "[Original Date]"} and the revised completion date is ${data.revisedCompletionDate || "[Revised Date]"}. The current reported movement equates to ${metrics.delayDays > 0 ? `${metrics.delayDays} days of delay` : metrics.delayDays < 0 ? `${Math.abs(metrics.delayDays)} days ahead of the original completion date` : "no net movement between the entered dates"}.

4. Key Risks and Matters to Monitor
${risks.map((risk, index) => `${index + 1}. ${risk}`).join("\n")}

5. QS Commentary
${data.qsComments || "[Insert project specific QS commentary here]"}

6. Draft Recommendation
Subject to verification of the claim against site progress, supporting documentation, approved variation status and any excluded or incomplete works, the current drawdown request appears capable of further assessment. At this stage, there are ${risks.length > 1 ? "matters requiring ongoing monitoring" : "no immediate material issues evident from the limited data entered"}, and the recommended certification position should remain subject to normal QS review and final confirmation.
`;
}

export default function BankReportingMVP() {
  const [form, setForm] = useState(initialForm);
  const [copied, setCopied] = useState(false);

  const metrics = useMemo(() => {
    const contractSum = parseMoney(form.contractSum);
    const previousCertified = parseMoney(form.previousCertified);
    const currentClaim = parseMoney(form.currentClaim);
    const approvedVariations = parseMoney(form.approvedVariations);
    const pendingVariations = parseMoney(form.pendingVariations);
    const contingencyRemaining = parseMoney(form.contingencyRemaining);
    const totalCertified = previousCertified + currentClaim;

    return {
      contractSum,
      previousCertified,
      currentClaim,
      approvedVariations,
      pendingVariations,
      contingencyRemaining,
      totalCertified,
      certifiedPctOfContract: contractSum ? (totalCertified / contractSum) * 100 : 0,
      claimAsPctOfContract: contractSum ? (currentClaim / contractSum) * 100 : 0,
      pendingVariationPct: contractSum ? (pendingVariations / contractSum) * 100 : 0,
      contingencyPct: contractSum ? (contingencyRemaining / contractSum) * 100 : 0,
      delayDays: daysBetween(form.originalCompletionDate, form.revisedCompletionDate),
    };
  }, [form]);

  const risks = useMemo(() => buildRiskFlags(metrics), [metrics]);
  const report = useMemo(() => buildReport(form, metrics, risks), [form, metrics, risks]);

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

  const fields = [
    ["projectName", "Project Name"],
    ["borrower", "Borrower"],
    ["lender", "Lender"],
    ["builder", "Builder"],
    ["contractSum", "Contract Sum (AUD)"],
    ["previousCertified", "Previous Certified (AUD)"],
    ["currentClaim", "Current Claim (AUD)"],
    ["approvedVariations", "Approved Variations (AUD)"],
    ["pendingVariations", "Pending Variations (AUD)"],
    ["contingencyRemaining", "Contingency Remaining (AUD)"],
    ["originalCompletionDate", "Original Completion Date"],
    ["revisedCompletionDate", "Revised Completion Date"],
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
      maxWidth: 1280,
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
      gridTemplateColumns: "1.25fr 0.9fr",
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
      minHeight: 520,
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
              <h1 style={{ margin: 0, fontSize: 36 }}>Bank Reporting MVP</h1>
              <p style={{ marginTop: 10, color: "#475569", maxWidth: 800, lineHeight: 1.5 }}>
                A simple prototype for monthly bank reporting automation. Enter the core project data, review the calculated indicators, and generate a draft report narrative for QS review.
              </p>
            </div>
            <div style={{ background: "#e2e8f0", borderRadius: 12, padding: "10px 14px", height: "fit-content" }}>
              Version 1 prototype
            </div>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={sectionStyle()}>
            <div style={styles.titleRow}>
              <ClipboardList size={20} />
              <span>Project Input Form</span>
            </div>

            <div style={styles.fieldGrid}>
              {fields.map(([key, label]) => (
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

            <div style={{ marginTop: 16 }}>
              <label style={styles.label}>QS Comments</label>
              <textarea
                value={form.qsComments}
                onChange={(e) => handleChange("qsComments", e.target.value)}
                placeholder="Insert project specific commentary, site observations, claim concerns, variation notes, or lender comments"
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
                  <div style={{ color: "#64748b", fontSize: 13 }}>Pending Variations %</div>
                  <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{formatPercent(metrics.pendingVariationPct)}</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Contingency %</div>
                  <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{formatPercent(metrics.contingencyPct)}</div>
                </div>
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
