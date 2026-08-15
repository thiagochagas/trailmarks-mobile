import { geoMercator, geoPath, type GeoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldAtlas from "./world-atlas.json";

const topology = worldAtlas as unknown as Topology;
const paisesGeoJson = feature(topology, topology.objects.countries as GeometryCollection);

export function paisesFeatures() {
  return paisesGeoJson.features;
}

export function criarProjecao(
  largura: number,
  altura: number,
  escala: number,
  centro?: [number, number]
): { path: GeoPath<unknown, GeoPermissibleObjects>; projection: ReturnType<typeof geoMercator> } {
  const projection = geoMercator()
    .scale(escala)
    .translate([largura / 2, altura / 2]);
  if (centro) projection.center(centro);
  const path = geoPath(projection);
  return { path, projection };
}
