// Gera src/lib/domain/paises-data.json a partir do dataset "world-countries"
// (devDependency, nunca importado em runtime). Rodar com `npm run gerar-paises`
// sempre que precisar regenerar (ex. após atualizar a dependência).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import countries from "world-countries";

const paises = countries
  .map((c) => ({
    cca2: c.cca2,
    ccn3: c.ccn3 || null,
    nomePt: c.translations?.por?.common ?? c.name.common,
    nomeEn: c.name.common,
    continente: c.region,
    latitude: c.latlng?.[0] ?? null,
    longitude: c.latlng?.[1] ?? null,
  }))
  .sort((a, b) => a.nomePt.localeCompare(b.nomePt, "pt-BR"));

const destino = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "lib",
  "domain",
  "paises-data.json"
);

writeFileSync(destino, JSON.stringify(paises, null, 2) + "\n");
console.log(`Gerado ${paises.length} países em ${destino}`);
