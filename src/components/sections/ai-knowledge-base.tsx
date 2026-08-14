"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Upload, Trash2, Send, Sparkles, FileText, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { AiButton, AiResultCard, AiBadge, AiDisabledNote } from "@/components/bh/ai-ui";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";

interface KBDoc { id: string; title: string; sourceType: string; status: string; chunks: number; createdAt: string; preview: string }
interface KBAnswer { answer: string; sources: { title: string; snippet: string }[]; confident: boolean }

export function AiKnowledgeBaseSection() {
  return (
    <AISectionGuard feature="AI Knowledge Base">
      <Content />
    </AISectionGuard>
  );
}

function Content() {
  const { status } = useAIStatus();
  const { run: runQa, loading: qaLoading } = useAIRun();
  const [docs, setDocs] = React.useState<KBDoc[]>([]);
  const [docsLoading, setDocsLoading] = React.useState(true);
  const [showUpload, setShowUpload] = React.useState(false);

  // upload form
  const [title, setTitle] = React.useState("");
  const [sourceType, setSourceType] = React.useState("faq");
  const [content, setContent] = React.useState("");

  // Q&A
  const [question, setQuestion] = React.useState("What plans do you offer and is there a free trial?");
  const [answer, setAnswer] = React.useState<KBAnswer | null>(null);

  const fetchDocs = async () => {
    setDocsLoading(true);
    try {
      const res = await fetch("/api/ai/kb");
      const data = await res.json();
      setDocs(data.documents || []);
    } catch { /* ignore */ }
    setDocsLoading(false);
  };

  React.useEffect(() => { void fetchDocs(); }, []);

  const handleUpload = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Title and content are required"); return; }
    const res = await fetch("/api/ai/kb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, sourceType, content }),
    });
    const data = await res.json();
    if (data.ok) {
      toast.success(`Indexed ${data.chunks} chunks`);
      setTitle(""); setContent("");
      setShowUpload(false);
      void fetchDocs();
    } else {
      toast.error(data.error || "Upload failed");
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/ai/kb/${id}`, { method: "DELETE" });
    toast.success("Document deleted");
    void fetchDocs();
  };

  const handleAsk = async () => {
    const result = await runQa<KBAnswer>("kb_answer", { question });
    if (result.ok && result.data) {
      setAnswer(result.data);
    } else if (result.error) toast.error(result.error);
  };

  return (
    <div>
      <AISectionIntro
        title="AI Knowledge Base"
        description="Upload FAQs, documents and website content. Text is extracted, chunked, embedded and stored as vectors. For each question, only relevant chunks are retrieved (never the whole collection) and sent to OpenAI for a grounded answer."
        isDemo={status?.isDemo}
      />

      <Card className="mb-6 bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Sparkles className="h-3.5 w-3.5 text-ai" />
            <span className="font-medium">Retrieval pipeline:</span>
            Document → Text extraction → Chunking → Embedding → Vector storage → Semantic retrieval → OpenAI → Answer
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-ai" /> Documents</span>
              <Button size="sm" variant="outline" onClick={() => setShowUpload((s) => !s)}>
                <Upload className="h-3.5 w-3.5" /> Upload
              </Button>
            </CardTitle>
            <CardDescription>Supported: PDF, TXT, DOCX, CSV, FAQ, website content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {showUpload && (
              <div className="rounded-lg border border-dashed p-4 space-y-3 bg-muted/20">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Refund Policy" />
                </div>
                <div className="space-y-2">
                  <Label>Source type</Label>
                  <Select value={sourceType} onValueChange={setSourceType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["faq", "pdf", "txt", "docx", "csv", "website"].map((s) => <SelectItem key={s} value={s} className="uppercase">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content (paste extracted text)</Label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Paste the document text here. In production this comes from file upload + extraction." />
                </div>
                <div className="flex gap-2">
                  <AiButton onClick={handleUpload} disabled={!title.trim() || !content.trim()}>Upload &amp; Index</AiButton>
                  <Button variant="ghost" onClick={() => setShowUpload(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {docsLoading ? (
              <div className="text-sm text-muted-foreground py-4 text-center">Loading documents…</div>
            ) : docs.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">No documents yet.</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto bh-scroll">
                {docs.map((d) => (
                  <div key={d.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm truncate">{d.title}</span>
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase">{d.sourceType}</Badge>
                      <Badge variant={d.status === "ready" ? "secondary" : d.status === "failed" ? "destructive" : "outline"} className="text-[10px] capitalize">{d.status}</Badge>
                      <span className="text-xs text-muted-foreground">{d.chunks} chunks</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{d.preview}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4 text-ai" /> Ask the Knowledge Base</CardTitle>
            <CardDescription>Answers use only retrieved, approved organizational information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} />
            </div>
            <AiButton onClick={handleAsk} disabled={qaLoading || !question.trim()} className="w-full">
              <Sparkles className={qaLoading ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} /> Ask
            </AiButton>

            {answer && (
              <AiResultCard title={answer.confident ? "Answer" : "Fallback"}>
                <div className="space-y-3">
                  <p className="whitespace-pre-wrap">{answer.answer}</p>
                  {!answer.confident && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded p-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      The AI could not confidently answer from the knowledge base. The conversation will be assigned to a human agent.
                    </div>
                  )}
                  {answer.sources.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Sources retrieved</div>
                      <div className="space-y-1.5">
                        {answer.sources.map((s, i) => (
                          <div key={i} className="text-xs bg-muted/40 rounded p-2">
                            <div className="font-medium">{s.title}</div>
                            <div className="text-muted-foreground mt-0.5 line-clamp-2">{s.snippet}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AiResultCard>
            )}
            <AiDisabledNote />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
