export default function LineList({ lines }: { lines: string[] }) {
  if (!lines.length)
    return <p className="text-zinc-400">Adicione uma informação por linha.</p>;
  return (
    <ul className="space-y-1.5">
      {lines.map((line, index) => (
        <li key={`${line}-${index}`} className="flex gap-2 leading-snug">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}
