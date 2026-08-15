import { WorldMap } from "@/components/maps/WorldMap";

export function MapaPreview({ latitude, longitude }: { latitude: number; longitude: number }) {
  return (
    <WorldMap
      paisesVisitados={[]}
      marcadores={[
        {
          id: "preview",
          cidade: null,
          nomePais: "",
          latitude,
          longitude,
          status: "realizada",
          dataInicio: null,
          dataFim: null,
          observacoes: null,
        },
      ]}
      centro={[longitude, latitude]}
      escala={350}
      largura={320}
      altura={160}
      interativo={false}
    />
  );
}
