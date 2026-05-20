import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { createRafflePixCheckout, getPublicRaffleBySlug } from "@/services/supabase/raffles";

export default function PublicRafflePage() {
  const { slug = "" } = useParams();
  const [raffle, setRaffle] = useState<any | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [email, setEmail] = useState("");
  const [checkout, setCheckout] = useState<any>(null);

  useEffect(()=>{ void getPublicRaffleBySlug(slug).then(setRaffle); }, [slug]);
  const closed = raffle && (new Date(raffle.sales_end_at).getTime() < Date.now() || raffle.status === "closed");
  const total = useMemo(()=> (raffle ? selected.length * raffle.number_price_cents : 0), [selected, raffle]);

  async function checkoutPix() {
    const data = await createRafflePixCheckout({ raffleId: raffle.id, selectedNumbers: selected, buyerName: name, buyerPhone: phone, buyerInstagram: instagram, buyerEmail: email });
    setCheckout(data);
  }

  return <MainLayout className="min-h-dvh bg-zinc-50 px-4 py-6 dark:bg-zinc-950"><div className="mx-auto max-w-4xl rounded-[28px] border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
    {!raffle ? "Carregando rifa..." : <>
      <h1 className="text-xl font-bold">{raffle.title}</h1>
      <p className="mt-2 text-sm">{raffle.description}</p>
      {closed ? <button className="mt-6 rounded-xl border px-4 py-3">Rifa encerrada. Número ganhador: {raffle.winning_number ?? "-"}</button> : <>
        <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-10">{Array.from({length: raffle.total_numbers}, (_,i)=>i+1).map((n:number)=>{ const sold = raffle.sold_numbers.includes(n); const active = selected.includes(n); return <button key={n} disabled={sold} onClick={()=>setSelected((prev)=> prev.includes(n)? prev.filter(x=>x!==n): [...prev,n])} className={`rounded-lg border p-2 text-xs ${sold?"opacity-40":""} ${active?"bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900":""}`}>{n}</button>})}</div>
        <div className="mt-6 space-y-2"><input className="w-full rounded-xl border p-3 dark:bg-zinc-800" placeholder="Nome completo" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="w-full rounded-xl border p-3 dark:bg-zinc-800" placeholder="Whatsapp" value={phone} onChange={(e)=>setPhone(e.target.value)} />
        <input className="w-full rounded-xl border p-3 dark:bg-zinc-800" placeholder="Instagram (opcional)" value={instagram} onChange={(e)=>setInstagram(e.target.value)} />
        <input className="w-full rounded-xl border p-3 dark:bg-zinc-800" placeholder="E-mail (opcional)" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <button onClick={checkoutPix} className="rounded-xl bg-zinc-900 px-4 py-3 text-white dark:bg-zinc-100 dark:text-zinc-900">Pagar R$ {(total/100).toFixed(2)}</button></div>
      </>}
      {checkout ? <div className="mt-6 rounded-xl border p-4 text-sm">Pagamento concluído. Código: {checkout.checkoutCode}</div> : null}
    </>}
  </div></MainLayout>;
}
