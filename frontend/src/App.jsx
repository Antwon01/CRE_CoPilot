import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, Database, Upload, Quote } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

/**
 * CRE Copilot – JSON Upload Version (2025)
 * Allows user to upload generated JSON (from backend/data/cre_copilot_demo.json)
 * and query with natural language prompts mapped to SQL templates.
 */

export default function App() {
  const [data, setData] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);

  const onUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        setData(parsed);
        alert("✅ Data loaded successfully!");
      } catch (err) {
        alert("❌ Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
  };

  const interpretPrompt = (raw) => {
    const p = raw.toLowerCase();
    if (p.includes("pipeline") && p.includes("last year")) return { type: "pipeline_vs_ly" };
    if (p.includes("pipeline") && p.includes("by region")) return { type: "pipeline_by_region" };
    if (p.includes("delinquen") && p.includes("unemployment")) return { type: "delinq_vs_macro" };
    if (p.includes("average rate") && p.includes("product")) return { type: "rate_by_product" };
    return { type: "unknown" };
  };

  const onAsk = () => {
    if (!data) return alert("Please upload cre_copilot_demo.json first.");
    const intent = interpretPrompt(prompt);
    let res = {};

    switch (intent.type) {
      case "pipeline_vs_ly": {
        const thisMonth = data.pipeline.filter((r) => r.month === "2025-09");
        const lastYear = data.pipeline.filter((r) => r.month === "2024-09");
        const regions = [...new Set(thisMonth.map((r) => r.region))];
        const table = regions.map((reg) => {
          const now = thisMonth.filter((r) => r.region === reg);
          const ly = lastYear.filter((r) => r.region === reg);
          const sum = (arr, key) => arr.reduce((a, b) => a + (b[key] || 0), 0);
          return {
            region: reg,
            units_mtd: sum(now, "units"),
            units_ly: sum(ly, "units"),
            dollars_mtd: sum(now, "dollars"),
            dollars_ly: sum(ly, "dollars"),
          };
        });
        res = {
          headline: "Pipeline MTD vs LY",
          table,
          chartType: "bar2",
          chart: table.map((r) => ({ name: r.region, MTD: r.dollars_mtd, LY: r.dollars_ly })),
          sql: "-- Guardrailed query for pipeline MTD vs LY",
          sources: ["pipeline"],
        };
        break;
      }
      case "pipeline_by_region": {
        const month = "2025-09";
        const byRegion = {};
        data.pipeline.filter((r) => r.month === month).forEach((r) => {
          if (!byRegion[r.region]) byRegion[r.region] = { region: r.region, units: 0, dollars: 0 };
          byRegion[r.region].units += r.units;
          byRegion[r.region].dollars += r.dollars;
        });
        const table = Object.values(byRegion);
        res = {
          headline: "Pipeline by Region",
          table,
          chartType: "bar",
          chart: table.map((r) => ({ name: r.region, Dollars: r.dollars, Units: r.units })),
          sql: "-- Guardrailed query for pipeline by region",
          sources: ["pipeline"],
        };
        break;
      }
      case "delinq_vs_macro": {
        const del = data.delinquency.filter((r) => r.bucket === "30+");
        const merged = del.map((r) => ({
          month: r.month,
          delinq: r.rate,
          unemployment: (data.macro.find((m) => m.month === r.month) || {}).unemployment,
        })).filter((x) => x.unemployment);
        res = {
          headline: "Delinquency vs Unemployment",
          table: merged,
          chartType: "line2",
          chart: merged.map((r) => ({ name: r.month, Delinquency: r.delinq, Unemployment: r.unemployment })),
          sql: "-- Guardrailed query for delinquency vs macro",
          sources: ["delinquency", "macro"],
        };
        break;
      }
      case "rate_by_product": {
        const month = "2025-09";
        const rows = data.products.filter((p) => p.month === month);
        res = {
          headline: "Weighted Avg Rate by Product",
          table: rows.map((r) => ({ product: r.product, region: r.region, avgRate: r.avgRate })),
          chartType: "bar",
          chart: rows.map((r) => ({ name: r.product + " (" + r.region + ")", Rate: r.avgRate })),
          sql: "-- Guardrailed query for weighted avg rate by product",
          sources: ["products"],
        };
        break;
      }
      default:
        res = {
          headline: "Unknown Prompt",
          table: [],
          chartType: "none",
          sql: "-- No matching SQL template",
          sources: [],
        };
    }
    setResult(res);
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Consumer Real Estate Copilot – Demo</h1>
          <p className="text-muted-foreground mt-2 flex items-start gap-2">
            <Quote className="w-4 h-4 mt-1" /> Ask a question. Upload your JSON from the generator and explore insights.
          </p>
        </header>

        <div className="flex gap-2 items-center mb-4">
          <Input type="file" accept=".json" onChange={onUpload} />
          <Upload className="w-5 h-5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-4">
            <Label htmlFor="prompt">Ask</Label>
            <Input id="prompt" placeholder="e.g. Pipeline units and dollars MTD vs last year" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onAsk()} />
          </div>
          <div className="md:col-span-2">
            <Button className="w-full" onClick={onAsk}>Ask</Button>
          </div>
        </div>

        {result && (
          <Card className="mt-6 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">{result.headline}</h2>

              {result.chartType === "bar" && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.chart}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Dollars" />
                      <Bar dataKey="Units" />
                      <Bar dataKey="Rate" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {result.chartType === "bar2" && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.chart}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="MTD" />
                      <Bar dataKey="LY" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {result.chartType === "line2" && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.chart}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Delinquency" stroke="#8884d8" />
                      <Line type="monotone" dataKey="Unemployment" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {result.table && result.table.length > 0 && (
                <div className="mt-6 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {Object.keys(result.table[0]).map((k) => (
                          <th key={k} className="text-left border-b p-2">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.table.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/50">
                          {Object.keys(row).map((k) => (
                            <td key={k} className="border-b p-2">{row[k]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mt-4"><Database className="w-4 h-4 mr-2" />View SQL / Sources</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>SQL Template</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="sql">
                    <TabsList>
                      <TabsTrigger value="sql">SQL</TabsTrigger>
                      <TabsTrigger value="sources">Sources</TabsTrigger>
                    </TabsList>
                    <TabsContent value="sql">
                      <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">{result.sql}</pre>
                    </TabsContent>
                    <TabsContent value="sources">
                      <ul className="list-disc pl-6">
                        {result.sources.map((s, i) => (<li key={i}>{s}</li>))}
                      </ul>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
