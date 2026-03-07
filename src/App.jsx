import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  return `${value.toFixed(1)}%`;
}

function daysBetween(date1, date2) {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const ms = d2 - d1;
  return Math.round(ms / (1000 * 60 * 60 * 24));
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Bank Reporting MVP</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                A simple prototype for monthly bank reporting automation. Enter the core project data, review the calculated indicators, and generate a draft report narrative for QS review.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
              Version 1 prototype
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ClipboardList className="h-5 w-5" />
                Project Input Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {fields.map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type={key.toLowerCase().includes("date") ? "date" : "text"}
                      value={form[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder={label}
                      className="rounded-2xl"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="qsComments">QS Comments</Label>
                <Textarea
                  id="qsComments"
                  value={form.qsComments}
                  onChange={(e) => handleChange("qsComments", e.target.value)}
                  placeholder="Insert project specific commentary, site observations, claim concerns, variation notes, or lender comments"
                  className="min-h-[140px] rounded-2xl"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={copyReport} className="rounded-2xl">
                  <FileText className="mr-2 h-4 w-4" />
                  {copied ? "Copied" : "Copy Draft Report"}
                </Button>
                <Button variant="outline" onClick={resetForm} className="rounded-2xl">
                  Reset Form
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calculator className="h-5 w-5" />
                  Snapshot Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">Total Certified</div>
                    <div className="mt-1 text-2xl font-semibold">{formatMoney(metrics.totalCertified)}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">Certified % of Contract</div>
                    <div className="mt-1 text-2xl font-semibold">{formatPercent(metrics.certifiedPctOfContract)}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">Pending Variations %</div>
                    <div className="mt-1 text-2xl font-semibold">{formatPercent(metrics.pendingVariationPct)}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">Contingency %</div>
                    <div className="mt-1 text-2xl font-semibold">{formatPercent(metrics.contingencyPct)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <AlertTriangle className="h-5 w-5" />
                  Auto Risk Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {risks.map((risk, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                      {risk}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Generated Draft Report</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={report} readOnly className="min-h-[520px] rounded-2xl font-mono text-sm" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
