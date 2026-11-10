import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  Copy,
  ExternalLink,
  FileDown,
  History,
  Link2,
  ListPlus,
  LogIn,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Tv,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const playlistUrl = typeof window === "undefined" ? "/lista.m3u" : `${window.location.origin}/lista.m3u`;

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    online: { label: "Online", className: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20" },
    offline: { label: "Offline", className: "bg-red-500/15 text-red-300 border-red-400/20" },
    official_page_only: { label: "Página oficial", className: "bg-amber-500/15 text-amber-200 border-amber-400/20" },
    pending: { label: "Pendente", className: "bg-slate-500/15 text-slate-300 border-slate-400/20" },
  };
  const item = config[status] ?? config.pending;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium ${item.className}`}>{status === "online" ? <CheckCircle2 size={12} /> : status === "offline" ? <XCircle size={12} /> : <CircleAlert size={12} />}{item.label}</span>;
}

export default function Home() {
  const { user, loading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const snapshot = trpc.playlist.snapshot.useQuery(undefined, { enabled: user?.role === "admin" });
  const refresh = trpc.playlist.refresh.useMutation({
    onSuccess: async (result) => {
      toast.success(`Verificação concluída: ${result.onlineCount} fonte(s) online.`);
      await snapshot.refetch();
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => setIsRefreshing(false),
  });

  const stats = useMemo(() => {
    const channels = snapshot.data?.channels ?? [];
    return {
      total: channels.length,
      online: channels.filter((item) => item.status === "online").length,
      pageOnly: channels.filter((item) => item.status === "official_page_only").length,
      offline: channels.filter((item) => item.status === "offline").length,
    };
  }, [snapshot.data]);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(playlistUrl);
    toast.success("URL fixa copiada");
  };

  if (loading) return <div className="min-h-screen bg-[#0d0e0c] text-white grid place-items-center"><RefreshCw className="animate-spin text-lime-300" /></div>;
  if (!user) return <PublicLanding onLogin={() => startLogin()} />;
  if (user.role !== "admin") return <PublicLanding onLogin={() => startLogin()} restricted />;

  return (
    <div className="min-h-screen bg-[#0d0e0c] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d0e0c]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300 text-slate-950"><Tv size={20} /></div><div><p className="font-semibold tracking-tight">VistaPlay Control</p><p className="text-xs text-slate-500">Gerenciador M3U autorizado</p></div></div>
          <div className="flex items-center gap-3 text-xs text-slate-400"><ShieldCheck size={15} className="text-lime-300" /> {user.name || user.email || "Administrador"}</div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-lime-300/20 bg-[radial-gradient(circle_at_top_right,rgba(190,255,88,.16),transparent_42%),#151813] p-7 shadow-2xl shadow-black/20">
            <div className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-[.18em] text-lime-300"><Activity size={14} /> URL permanente</div>
            <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-white md:text-5xl">Uma lista fixa. Fontes verificadas automaticamente.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-400">O DuplCast cadastra uma única URL. O sistema só publica fontes diretas marcadas como autorizadas e que responderam com manifesto HLS válido.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row"><div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-xs text-lime-100"><Link2 size={15} className="shrink-0 text-lime-300" /><span className="truncate">{playlistUrl}</span></div><button onClick={() => void copyUrl()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-lime-200"><Copy size={15} /> Copiar URL</button></div>
            <div className="mt-6 flex flex-wrap gap-3"><a href="/player" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:border-lime-300/50"><PlayCircle size={16} /> Abrir player</a><a href="/lista.m3u" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:border-lime-300/50"><FileDown size={16} /> Ver M3U</a></div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2">{[
            { label: "Canais", value: stats.total, Icon: Tv },
            { label: "Online", value: stats.online, Icon: CheckCircle2 },
            { label: "Página oficial", value: stats.pageOnly, Icon: ExternalLink },
            { label: "Offline", value: stats.offline, Icon: XCircle },
          ].map(({ label, value, Icon }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><Icon size={17} className={label === "Online" ? "text-emerald-300" : label === "Offline" ? "text-red-300" : "text-lime-300"} /><p className="mt-7 text-3xl font-semibold text-white">{value}</p><p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{label}</p></div>)}</div>
        </section>

        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-5 md:flex-row md:items-center"><div><p className="text-sm font-semibold text-white">Verificação manual</p><p className="mt-1 text-xs text-slate-500">Testa somente as fontes diretas autorizadas cadastradas. Páginas oficiais não são convertidas em M3U.</p></div><button disabled={isRefreshing || refresh.isPending} onClick={() => { setIsRefreshing(true); refresh.mutate({ trigger: "manual" }); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} /> {isRefreshing ? "Verificando…" : "Verificar agora"}</button></section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="text-sm font-semibold text-white">Canais cadastrados</p><p className="mt-1 text-xs text-slate-500">Categorias preservadas no group-title da M3U.</p></div><a href="/player" className="text-xs text-lime-300 hover:text-lime-200">Abrir player →</a></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3 font-medium">Canal</th><th className="px-5 py-3 font-medium">Grupo</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Fonte oficial</th><th className="px-5 py-3 font-medium">Checado</th></tr></thead><tbody className="divide-y divide-white/[.07]">{snapshot.isLoading ? <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Carregando canais…</td></tr> : (snapshot.data?.channels ?? []).map((channel) => <tr key={channel.id} className="hover:bg-white/[.025]"><td className="px-5 py-4 font-medium text-slate-200">{channel.name}</td><td className="px-5 py-4 text-xs text-slate-400">{channel.groupTitle}</td><td className="px-5 py-4"><StatusBadge status={channel.status} /></td><td className="px-5 py-4"><a href={channel.officialPageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-lime-300 hover:text-lime-200">Abrir página <ExternalLink size={12} /></a></td><td className="px-5 py-4 text-xs text-slate-500">{channel.lastCheckedAt ? new Date(channel.lastCheckedAt).toLocaleString("pt-BR") : "Ainda não"}</td></tr>)}</tbody></table></div></section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="mb-4 flex items-center gap-2"><ListPlus size={16} className="text-lime-300" /><p className="text-sm font-semibold">Fontes diretas cadastradas</p></div><div className="space-y-3">{(snapshot.data?.sources ?? []).map((source) => <div key={source.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/[.08] bg-black/10 px-3 py-3"><div className="min-w-0"><p className="truncate text-xs text-slate-200">{source.label}</p><p className="truncate font-mono text-[10px] text-slate-600">{source.url}</p></div><StatusBadge status={source.status} /></div>)}{!snapshot.data?.sources?.length && <p className="text-sm text-slate-500">Nenhuma fonte direta cadastrada além das que aguardam autorização.</p>}</div></div><div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="mb-4 flex items-center gap-2"><History size={16} className="text-lime-300" /><p className="text-sm font-semibold">Histórico recente</p></div><div className="space-y-3">{(snapshot.data?.runs ?? []).slice(0, 5).map((run) => <div key={run.id} className="flex items-center justify-between border-b border-white/[.07] pb-3 text-xs"><span className="text-slate-400">{new Date(run.startedAt).toLocaleString("pt-BR")}</span><span className="text-emerald-300">{run.onlineCount} online</span></div>)}{!snapshot.data?.runs?.length && <p className="text-sm text-slate-500">Nenhuma execução registrada.</p>}</div></div></section>
      </main>
    </div>
  );
}

function PublicLanding({ onLogin, restricted = false }: { onLogin: () => void; restricted?: boolean }) {
  return <div className="min-h-screen bg-[#0d0e0c] text-slate-100"><main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16"><div className="max-w-2xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1.5 text-xs text-lime-200"><ShieldCheck size={14} /> VistaPlay / fontes autorizadas</div><h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">Gerencie sua lista M3U com uma URL que não muda.</h1><p className="mt-6 max-w-xl text-base leading-7 text-slate-400">Cadastre páginas oficiais, fontes diretas autorizadas e acompanhe a disponibilidade sem extrair tokens, quebrar DRM ou usar listas de terceiros.</p>{restricted && <p className="mt-5 text-sm text-amber-200">Sua conta está autenticada, mas ainda não tem permissão de administrador.</p>}<div className="mt-8 flex flex-wrap gap-3"><button onClick={onLogin} className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-semibold text-slate-950"><LogIn size={16} /> Entrar como administrador</button><a href="/player" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-200"><PlayCircle size={16} /> Abrir player</a></div></div></main></div>;
}
