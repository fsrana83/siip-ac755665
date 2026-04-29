import { useState, useRef, useEffect, useMemo } from 'react';
import { Brain, Send, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useData } from '@/contexts/DataContext';
import { useConfig } from '@/contexts/ConfigContext';
import { mockReinsurance } from '@/lib/mockData';
import { computeCapacityStatuses } from '@/lib/capacityUtils';
import { useToast } from '@/hooks/use-toast';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'Assess mortality risk concentration in our active portfolio.',
  'Are our current per-mille rates adequate? Suggest adjustments.',
  'Identify reinsurance treaties at risk of breaching capacity.',
  'Recommend pricing loadings for substandard lives.',
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/actuary-ai`;

const Actuary = () => {
  const { policies, proposals, quotations } = useData();
  const { products, treaties } = useConfig();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const portfolio = useMemo(() => {
    const policyClientMap = Object.fromEntries(policies.map(p => [p.policyNo, p.policyHolder || p.clientName]));
    const capacity = computeCapacityStatuses(treaties, mockReinsurance, policyClientMap);
    const totalSA = policies.reduce((s, p) => s + p.sumAssured, 0);
    const totalPremium = policies.reduce((s, p) => s + p.totalPremium, 0);
    const byProduct = policies.reduce<Record<string, { count: number; sa: number; premium: number }>>((acc, p) => {
      acc[p.productName] ||= { count: 0, sa: 0, premium: 0 };
      acc[p.productName].count += 1;
      acc[p.productName].sa += p.sumAssured;
      acc[p.productName].premium += p.totalPremium;
      return acc;
    }, {});
    return {
      summary: {
        activePolicies: policies.filter(p => p.status === 'Active').length,
        totalPolicies: policies.length,
        openProposals: proposals.length,
        openQuotations: quotations.length,
        totalSumAssured: totalSA,
        totalPremium: Number(totalPremium.toFixed(3)),
        avgRatePerMille: totalSA ? Number(((totalPremium / totalSA) * 1000).toFixed(3)) : 0,
      },
      byProduct,
      products: products.map(p => ({
        id: p.id, name: p.name, calcMethod: p.calcMethod,
        minAge: p.minAge, maxAge: p.maxAge, deathRates: p.deathRates,
      })),
      reinsuranceCapacity: capacity.map(c => ({
        treaty: c.treatyName, type: c.treatyType,
        capacity: c.capacity, used: c.used,
        utilizationPct: Number(c.utilizationPct.toFixed(1)),
        exceeded: c.exceeded,
      })),
    };
  }, [policies, proposals, quotations, products, treaties]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    const userMsg: Msg = { role: 'user', content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next, portfolio }),
      });

      if (resp.status === 429) {
        toast({ title: 'Rate limit', description: 'Please retry shortly.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: 'AI credits exhausted', description: 'Add credits in Workspace > Usage.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error('Stream failed');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, nl);
          textBuffer = textBuffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'AI request failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" /> Actuary
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered risk &amp; pricing analysis on your live portfolio</p>
      </div>

      {/* Portfolio snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <p className="text-lg font-display font-bold text-foreground">{portfolio.summary.activePolicies}</p>
          <p className="text-xs text-muted-foreground">Active Policies</p>
        </div>
        <div className="stat-card">
          <p className="text-lg font-display font-bold text-foreground">OMR {portfolio.summary.totalSumAssured.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Sum Assured</p>
        </div>
        <div className="stat-card">
          <p className="text-lg font-display font-bold text-foreground">OMR {portfolio.summary.totalPremium.toFixed(3)}</p>
          <p className="text-xs text-muted-foreground">Total Premium</p>
        </div>
        <div className="stat-card">
          <p className="text-lg font-display font-bold text-primary">{portfolio.summary.avgRatePerMille}‰</p>
          <p className="text-xs text-muted-foreground">Avg Rate / Mille</p>
        </div>
      </div>

      {/* Chat */}
      <div className="glass-card flex flex-col" style={{ height: '60vh' }}>
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Actuary AI Assistant</h3>
          <span className="ml-auto text-xs text-muted-foreground">Risk &amp; pricing analysis</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Ask the actuary AI about your portfolio. Try one of these:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="text-left text-xs p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
              {portfolio.reinsuranceCapacity.some(c => c.exceeded) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">
                    Capacity breaches detected. The AI will see this in its context.
                  </p>
                </div>
              )}
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-foreground'
                }`}>
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-table:text-xs">
                      <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> Analysing portfolio…
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="p-3 border-t border-border/50 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading}
            placeholder="Ask about mortality risk, rate adequacy, capacity exposure…"
            className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button type="submit" disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5">
            <Send className="w-4 h-4" /> Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Actuary;
