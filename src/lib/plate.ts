// The plate of a project: its technologies drawn as the layers of a stack (interface on top, then
// server, data…). Only the technologies listed in the content are drawn; the grouping is a reading
// aid, not a claim about the project's architecture. Unknown names go to "Autres".
const LAYERS: [string, string[]][] = [
  ['Interface', ['react', 'next.js', 'flutter', 'dart', 'javascript', 'typescript', 'chart.js', 'astro', 'html & css', 'vue', 'svelte', 'swift', 'kotlin', 'application mobile', 'dataviz', 'd3']],
  ['Serveur', ['node.js', 'php', 'python', 'scrapy', 'c# .net', 'java', 'go', 'express', 'symfony', 'laravel', 'django', 'fastapi']],
  ['Données', ['postgresql', 'mongodb', 'firebase', 'open data', 'sql server', 'mysql', 'redis', 'sqlite', 'pipelines de données']],
  ['Services & IA', ['google vision ai', 'openai', 'intégration de llm', 'llm', 'rag', 'géolocalisation', 'azure', 'power platform']],
  ['Infrastructure', ['docker', 'kubernetes', 'ci/cd', 'github actions', 'netlify']],
  ['Démarche', ['ux research', 'cadrage technique', 'cadrage', 'prototypage', 'co-conception', 'vie privée', 'ateliers d’innovation', "ateliers d'innovation"]],
];

export interface Layer {
  name: string;
  items: string[];
}

export function plateLayers(technologies: string[]): Layer[] {
  const out: Layer[] = [];
  const used = new Set<string>();
  for (const [name, known] of LAYERS) {
    const items = technologies.filter((t) => known.includes(t.trim().toLowerCase()));
    items.forEach((t) => {
    used.add(t);
  });
    if (items.length) out.push({ name, items });
  }
  const rest = technologies.filter((t) => !used.has(t));
  if (rest.length) out.push({ name: 'Autres', items: rest });
  return out;
}
