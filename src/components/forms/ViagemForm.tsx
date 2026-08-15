import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import type { Pessoa, StatusViagem, Viagem } from "@/lib/domain/types";
import { LABEL_STATUS } from "@/lib/domain/enums";
import { criarViagem, atualizarViagem, excluirViagem } from "@/lib/actions/viagens";
import { listarPessoas, criarPessoa } from "@/lib/actions/pessoas";
import { FormField } from "@/components/FormField";
import { FormSelect } from "@/components/FormSelect";
import { DateField } from "@/components/DateField";
import { StarRating } from "@/components/StarRating";
import { BuscaPais } from "@/components/forms/BuscaPais";
import { BuscaCidade } from "@/components/forms/BuscaCidade";
import { FotoUpload } from "@/components/forms/FotoUpload";
import { MapaPreview } from "@/components/maps/MapaPreview";
import { confirmar } from "@/lib/confirm";

interface FormValues {
  status: StatusViagem;
  codigoPais: string;
  nomePais: string;
  cidade: string;
  latitude: string;
  longitude: string;
  dataInicio: string;
  dataFim: string;
  avaliacao: number;
  observacoes: string;
  pessoaIds: string[];
  fotoPath: string | null;
}

function toValues(v?: Viagem): FormValues {
  return {
    status: v?.status ?? "planejada",
    codigoPais: v?.codigoPais ?? "",
    nomePais: v?.nomePais ?? "",
    cidade: v?.cidade ?? "",
    latitude: v?.latitude !== null && v?.latitude !== undefined ? String(v.latitude) : "",
    longitude: v?.longitude !== null && v?.longitude !== undefined ? String(v.longitude) : "",
    dataInicio: v?.dataInicio ?? "",
    dataFim: v?.dataFim ?? "",
    avaliacao: v?.avaliacao ?? 0,
    observacoes: v?.observacoes ?? "",
    pessoaIds: v?.pessoas.map((p) => p.id) ?? [],
    fotoPath: v?.fotoPath ?? null,
  };
}

function buildPayload(v: FormValues) {
  return {
    status: v.status,
    codigoPais: v.codigoPais,
    nomePais: v.nomePais,
    cidade: v.cidade || undefined,
    latitude: v.latitude ? Number(v.latitude) : undefined,
    longitude: v.longitude ? Number(v.longitude) : undefined,
    dataInicio: v.dataInicio || undefined,
    dataFim: v.dataFim || undefined,
    avaliacao: v.status === "realizada" && v.avaliacao > 0 ? v.avaliacao : undefined,
    observacoes: v.observacoes || undefined,
    pessoaIds: v.pessoaIds,
    fotoPath: v.fotoPath,
  };
}

export function ViagemForm({ viagem }: { viagem?: Viagem }) {
  const [values, setValues] = useState<FormValues>(toValues(viagem));
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pessoasDisponiveis, setPessoasDisponiveis] = useState<Pessoa[]>([]);
  const [mostrarNovaPessoa, setMostrarNovaPessoa] = useState(false);
  const [novaPessoaNome, setNovaPessoaNome] = useState("");
  const [criandoPessoa, setCriandoPessoa] = useState(false);

  useEffect(() => {
    listarPessoas().then((resultado) => {
      if (resultado.ok && resultado.data) setPessoasDisponiveis(resultado.data);
    });
  }, []);

  async function criarNovaPessoa() {
    if (!novaPessoaNome.trim()) return;
    setCriandoPessoa(true);
    const resultado = await criarPessoa(novaPessoaNome);
    if (!resultado.ok || !resultado.data) {
      setErro(resultado.error ?? "Falha ao criar pessoa.");
      setCriandoPessoa(false);
      return;
    }
    setPessoasDisponiveis((prev) => [...prev, resultado.data!]);
    set("pessoaIds", [...values.pessoaIds, resultado.data.id]);
    setNovaPessoaNome("");
    setMostrarNovaPessoa(false);
    setCriandoPessoa(false);
  }

  function set<K extends keyof FormValues>(campo: K, valor: FormValues[K]) {
    setValues((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    const resultado = viagem
      ? await atualizarViagem(viagem.id, buildPayload(values))
      : await criarViagem(buildPayload(values));

    if (!resultado.ok) {
      setErro(resultado.error ?? "Falha ao salvar viagem.");
      setSalvando(false);
      return;
    }
    setSalvando(false);
    router.replace("/");
  }

  function excluir() {
    if (!viagem) return;
    confirmar(`Excluir viagem para ${viagem.nomePais}?`, "Essa ação não pode ser desfeita.", async () => {
      setExcluindo(true);
      const resultado = await excluirViagem(viagem.id);
      if (!resultado.ok) {
        setErro(resultado.error ?? "Falha ao excluir.");
        setExcluindo(false);
        return;
      }
      setExcluindo(false);
      router.replace("/");
    });
  }

  return (
    <ScrollView contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
      <FormSelect
        label="Status"
        value={values.status}
        options={(Object.entries(LABEL_STATUS) as [StatusViagem, string][]).map(([valor, label]) => ({
          value: valor,
          label,
        }))}
        onChange={(v) => set("status", v as StatusViagem)}
      />

      <BuscaPais
        value={values.codigoPais}
        onChange={(pais) =>
          setValues((prev) => ({ ...prev, codigoPais: pais.cca2, nomePais: pais.nomePt }))
        }
      />

      <BuscaCidade
        value={values.cidade}
        onChange={(v) => set("cidade", v)}
        onSelecionar={(resultado) =>
          setValues((prev) => ({
            ...prev,
            cidade: resultado.cidade,
            latitude: String(resultado.lat),
            longitude: String(resultado.lon),
          }))
        }
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Latitude"
            value={values.latitude}
            onChangeText={(v) => set("latitude", v)}
            keyboardType="decimal-pad"
            placeholder="-22.9068"
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Longitude"
            value={values.longitude}
            onChangeText={(v) => set("longitude", v)}
            keyboardType="decimal-pad"
            placeholder="-43.1729"
          />
        </View>
      </View>

      {values.latitude && values.longitude && (
        <View className="gap-1">
          <Text className="text-xs text-muted-foreground">Prévia no mapa</Text>
          <MapaPreview latitude={Number(values.latitude)} longitude={Number(values.longitude)} />
        </View>
      )}

      {values.status !== "desejo" && (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <DateField
              label="Data de início"
              value={values.dataInicio}
              onChange={(novaData) =>
                setValues((prev) => ({
                  ...prev,
                  dataInicio: novaData,
                  dataFim:
                    !prev.dataFim || prev.dataFim === prev.dataInicio ? novaData : prev.dataFim,
                }))
              }
            />
          </View>
          <View className="flex-1">
            <DateField label="Data de fim" value={values.dataFim} onChange={(v) => set("dataFim", v)} />
          </View>
        </View>
      )}

      {values.status === "realizada" && (
        <StarRating valor={values.avaliacao} onChange={(v) => set("avaliacao", v)} />
      )}

      <View className="gap-2">
        <Text className="text-xs text-muted-foreground">Pessoas envolvidas</Text>
        <View className="flex-row flex-wrap gap-2">
          {pessoasDisponiveis.map((p) => {
            const ativo = values.pessoaIds.includes(p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() =>
                  set(
                    "pessoaIds",
                    ativo
                      ? values.pessoaIds.filter((id) => id !== p.id)
                      : [...values.pessoaIds, p.id]
                  )
                }
                className={`rounded-full border px-3 py-1.5 ${
                  ativo ? "border-primary bg-primary" : "border-border bg-transparent"
                }`}
              >
                <Text className={`text-xs font-medium ${ativo ? "text-primary-foreground" : "text-foreground"}`}>
                  {p.nome}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {!mostrarNovaPessoa ? (
          <Pressable onPress={() => setMostrarNovaPessoa(true)} className="self-start">
            <Text className="text-sm text-primary">+ Nova pessoa</Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center gap-2">
            <TextInput
              autoFocus
              value={novaPessoaNome}
              onChangeText={setNovaPessoaNome}
              placeholder="Nome da pessoa"
              className="flex-1 rounded-md border border-border px-3 py-2 text-sm text-foreground"
            />
            <Pressable
              onPress={criarNovaPessoa}
              disabled={!novaPessoaNome.trim() || criandoPessoa}
              className="rounded-md bg-primary px-3 py-2 disabled:opacity-50"
            >
              <Text className="text-sm font-medium text-primary-foreground">
                {criandoPessoa ? "..." : "Adicionar"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMostrarNovaPessoa(false);
                setNovaPessoaNome("");
              }}
            >
              <Text className="text-sm text-muted-foreground">Cancelar</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View className="gap-1">
        <Text className="text-xs text-muted-foreground">Foto</Text>
        <FotoUpload urlInicial={viagem?.fotoUrl ?? null} onChange={(path) => set("fotoPath", path)} />
      </View>

      <FormField
        label="Observações"
        value={values.observacoes}
        onChangeText={(v) => set("observacoes", v)}
        multiline
      />

      {erro && <Text className="text-sm text-destructive">{erro}</Text>}

      <View className="flex-row gap-3 pt-2">
        <Pressable
          onPress={salvar}
          disabled={salvando || !values.codigoPais}
          className="flex-1 items-center rounded-md bg-primary py-3 disabled:opacity-50"
        >
          <Text className="font-medium text-primary-foreground">
            {salvando ? "Salvando..." : "Salvar"}
          </Text>
        </Pressable>
        {viagem && (
          <Pressable
            onPress={excluir}
            disabled={excluindo}
            className="flex-1 items-center rounded-md border border-destructive py-3 disabled:opacity-50"
          >
            <Text className="font-medium text-destructive">
              {excluindo ? "Excluindo..." : "Excluir"}
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
