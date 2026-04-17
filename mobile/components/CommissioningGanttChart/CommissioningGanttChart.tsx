import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  Alert,
  InteractionManager,
  TextInput,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import Svg, { Defs, Line, Pattern, Path as SvgPath, Rect } from "react-native-svg";
import type {
  CommissioningGanttChartProps,
  GanttTask,
  GanttTheme,
} from "./types";

function areaDisplayLabel(task: GanttTask): string {
  return task.nomeArea?.trim() || "Área";
}

function directoryDisplayLabel(task: GanttTask): string {
  return task.nomeDiretorio?.trim() || task.nome?.trim() || "Sem diretório";
}

function taskMatchesTextSearch(task: GanttTask, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const parts = [
    task.nomeRota,
    task.nome,
    task.nomeDiretorio,
    task.nomeArea,
    areaDisplayLabel(task),
    directoryDisplayLabel(task),
  ]
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .join(" ")
    .toLowerCase();
  return parts.includes(needle);
}

type GanttFilterKind = "all" | "area" | "directory" | "search";

type FilterSubPicker = "area" | "directory";

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  eletrica: "#8b5cf6",
  instrumentacao: "#06b6d4",
  mecanica: "#f97316",
  automacao: "#ec4899",
  utilidades: "#3b82f6",
};

/** Linha superior (área/diretório + status) + barra */
const ROW_PAD_V = 4;
const ROW_META_H = 14;
const BAR_H = 20;
const ROW_H = ROW_PAD_V + ROW_META_H + 2 + BAR_H + ROW_PAD_V;
/** Faixa fixa à direita da timeline para o nome da rota (após o fim do trilho). */
const ROUTE_TAIL_PX = 168;
const ROUTE_AFTER_BAR_GAP = 8;
const AXIS_H = 28;
/** Largura da caixa do rótulo do eixo (dd/mm/aa); metade para centralizar no tick. */
const AXIS_LABEL_W = 56;
const AXIS_LABEL_HALF_W = AXIS_LABEL_W / 2;
const TIMELINE_SIDE_PAD = AXIS_LABEL_HALF_W;
const TODAY_STRIP_H = 18;

function safeSvgId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseTaskDate(input: string | Date): Date {
  if (input instanceof Date) return startOfDay(input);
  const t = Date.parse(input);
  if (Number.isNaN(t)) return startOfDay(new Date());
  return startOfDay(new Date(t));
}

function addDays(base: Date, days: number): Date {
  const x = new Date(base);
  x.setDate(x.getDate() + days);
  return startOfDay(x);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Primeiro e último dia inclusos (ambos 00:00). */
function daysBetweenInclusive(a: Date, b: Date): number {
  const s = startOfDay(a).getTime();
  const e = startOfDay(b).getTime();
  return Math.floor((e - s) / 86400000) + 1;
}

/** Intervalo customizado (De–Até): no máximo 90 dias inclusivos. */
const MAX_CUSTOM_RANGE_DAYS = 90;

type BarVisualState = "future" | "delayed" | "onTrack";

function resolveBarState(task: GanttTask, today: Date): BarVisualState {
  const start = parseTaskDate(task.data_inicio);
  const end = parseTaskDate(task.data_fim);
  const pct = clamp(Number(task.percentual_concluido) || 0, 0, 100);
  if (start > today) return "future";
  /** Atrasada: especificação — incompleto e data_fim antes de hoje */
  if (pct < 100 && end < today) return "delayed";
  return "onTrack";
}

/** Eixo da timeline (ano em 2 dígitos para caber melhor). */
function formatAxisDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/** Modal / período custom — ano completo. */
function formatDateFull(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const THEMES: Record<
  GanttTheme,
  {
    bg: string;
    card: string;
    text: string;
    muted: string;
    grid: string;
    trackBg: string;
    futureTrack: string;
  }
> = {
  light: {
    bg: "transparent",
    card: "#fff",
    text: "#111827",
    muted: "#6b7280",
    grid: "rgba(148, 163, 184, 0.45)",
    trackBg: "rgba(148, 163, 184, 0.35)",
    futureTrack: "rgba(148, 163, 184, 0.25)",
  },
  dark: {
    bg: "#12122b",
    card: "#12122b",
    text: "#f8fafc",
    muted: "#94a3b8",
    grid: "rgba(148, 163, 184, 0.2)",
    trackBg: "rgba(148, 163, 184, 0.2)",
    futureTrack: "rgba(148, 163, 184, 0.12)",
  },
};

function GanttBarRow({
  task,
  timelineWidth,
  timelineOffsetX,
  rangeStart,
  rangeEnd,
  today,
  theme,
  onPress,
}: {
  task: GanttTask;
  /** Largura usada para mapear datas → pixels (eixo). */
  timelineWidth: number;
  /** Espaço lateral antes do primeiro dia visível. */
  timelineOffsetX: number;
  rangeStart: Date;
  rangeEnd: Date;
  today: Date;
  theme: GanttTheme;
  onPress?: (task: GanttTask) => void;
}) {
  const rowContentWidth = timelineOffsetX + timelineWidth + TIMELINE_SIDE_PAD + ROUTE_TAIL_PX;
  const t = THEMES[theme];
  const start = parseTaskDate(task.data_inicio);
  const end = parseTaskDate(task.data_fim);
  const pct = clamp(Number(task.percentual_concluido) || 0, 0, 100);
  const state = resolveBarState(task, today);

  const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
  if (rangeMs <= 0) return null;

  const xFor = (d: Date) =>
    timelineOffsetX +
    ((d.getTime() - rangeStart.getTime()) / rangeMs) * timelineWidth;

  let barLeft = xFor(start);
  let barRight = xFor(addDays(end, 1));
  barLeft = clamp(barLeft, timelineOffsetX, timelineOffsetX + timelineWidth);
  barRight = clamp(barRight, timelineOffsetX, timelineOffsetX + timelineWidth);
  const barW = Math.max(0, barRight - barLeft);

  const progressW =
    state === "future" ? 0 : Math.max(0, (barW * pct) / 100);
  /** Largura mínima para centralizar o % dentro do preenchimento (texto branco) */
  const LABEL_INSIDE_GREEN_MIN = 36;
  /** Espaço horizontal reservado para o texto "100%" (~2 dígitos) sem cortar */
  const PCT_LABEL_W = 34;
  const GAP_AFTER_FILL = 4;

  const progressColor =
    state === "future"
      ? "transparent"
      : state === "onTrack"
        ? "#22c55e"
        : "#ef4444";

  const trackTint = state === "future" ? t.futureTrack : t.trackBg;

  const showHatch = state === "delayed";
  const hatchId = `hatch_${safeSvgId(task.id)}`;
  const barTop = ROW_PAD_V + ROW_META_H + 2;
  const routeLabelTop = barTop + Math.max(0, Math.floor((BAR_H - 11) / 2));
  const metaLeft = barLeft;
  /** Com barra curta, o texto (área/diretório) usa a faixa scrollável até a reserva do nome da rota. */
  const metaMaxW = Math.max(
    0,
    Math.max(barW - 8, rowContentWidth - metaLeft - ROUTE_TAIL_PX - 8),
  );
  const areaLabel = task.nomeArea?.trim() || "Área";
  const directoryLabel = task.nomeDiretorio?.trim() || task.nome?.trim() || "Sem diretório";

  let pctLeft: number | null = null;
  if (state !== "future" && barW > 0) {
    const maxLeft = Math.max(2, barW - PCT_LABEL_W);
    if (progressW >= LABEL_INSIDE_GREEN_MIN) {
      const centered = progressW / 2 - PCT_LABEL_W / 2;
      pctLeft = clamp(
        centered,
        2,
        Math.max(2, progressW - PCT_LABEL_W - 2),
      );
    } else {
      const afterFill = progressW > 0 ? progressW + GAP_AFTER_FILL : 2;
      pctLeft = clamp(afterFill, 2, maxLeft);
    }
  }

  /** Sempre após o fim do trilho da tarefa (não após só o preenchimento). */
  const routeLeft =
    barW > 0 && task.nomeRota ? barLeft + barW + ROUTE_AFTER_BAR_GAP : 0;
  const routeMaxW = ROUTE_TAIL_PX - ROUTE_AFTER_BAR_GAP - 8;

  return (
    <Pressable
      onPress={onPress ? () => onPress(task) : undefined}
      hitSlop={6}
      style={({ pressed }) => [
        styles.barRow,
        { height: ROW_H, width: rowContentWidth },
        onPress && pressed ? styles.barRowPressed : null,
      ]}
    >
      <View
        style={[
          styles.trackArea,
          {
            width: rowContentWidth,
            height: ROW_H,
            marginLeft: 0,
            backgroundColor: "transparent",
          },
        ]}
      >
        {barW > 0 && (
          <View
            style={[
              styles.metaRow,
              {
                left: metaLeft,
                top: ROW_PAD_V,
                maxWidth: metaMaxW,
              },
            ]}
          >
            <Text
              style={[styles.metaText, { color: t.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {areaLabel} • {directoryLabel}
            </Text>
            {state === "delayed" ? (
              <Text
                style={styles.metaWarning}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Atenção
              </Text>
            ) : null}
          </View>
        )}
        <View
          style={[
            styles.fullTrack,
            {
              left: barLeft,
              top: barTop,
              width: barW,
              backgroundColor: trackTint,
            },
          ]}
        >
          {progressW > 0 && (
            <View
              style={[
                styles.progressFill,
                {
                  width: progressW,
                  backgroundColor: progressColor,
                },
              ]}
            >
              {showHatch && progressW > 6 && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <Svg width={progressW} height={BAR_H} viewBox={`0 0 ${progressW} ${BAR_H}`}>
                    <Defs>
                      <Pattern
                        id={hatchId}
                        patternUnits="userSpaceOnUse"
                        width={6}
                        height={6}
                      >
                        <SvgPath
                          d="M0,6 L6,0"
                          stroke="rgba(255,255,255,0.35)"
                          strokeWidth={1}
                        />
                      </Pattern>
                    </Defs>
                    <Rect width={progressW} height={BAR_H} fill={`url(#${hatchId})`} />
                  </Svg>
                </View>
              )}
            </View>
          )}
          {pctLeft !== null && (
            <Text
              style={[
                styles.progressPctFloating,
                progressW >= LABEL_INSIDE_GREEN_MIN
                  ? styles.progressPctOnGreen
                  : styles.progressPctOnTrack,
                { left: pctLeft },
              ]}
              numberOfLines={1}
            >
              {Math.round(pct)}%
            </Text>
          )}
        </View>
        {barW > 0 && task.nomeRota ? (
          <Text
            style={[
              styles.routeAtBarEnd,
              {
                color: t.muted,
                left: routeLeft,
                top: routeLabelTop,
                maxWidth: routeMaxW,
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {task.nomeRota}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function CommissioningGanttChart({
  tasks,
  defaultWindowDays = 45,
  windowPresets = [14, 30, 45, 60, 90],
  theme = "light",
  pixelsPerDay = 12,
  categoryColors: categoryColorsProp,
  onTaskPress,
}: CommissioningGanttChartProps) {
  const [windowDays, setWindowDays] = useState(defaultWindowDays);
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [customRangeActive, setCustomRangeActive] = useState(false);
  const [customStart, setCustomStart] = useState<Date>(() =>
    addDays(startOfDay(new Date()), -22),
  );
  const [customEnd, setCustomEnd] = useState<Date>(() =>
    addDays(startOfDay(new Date()), 22),
  );
  const [draftCustomStart, setDraftCustomStart] = useState<Date>(customStart);
  const [draftCustomEnd, setDraftCustomEnd] = useState<Date>(customEnd);
  const [datePickerFor, setDatePickerFor] = useState<null | "from" | "to">(
    null,
  );
  /** Enquanto o usuário mexe em De/Até, nenhum preset mostra ✓ (evita “dois selecionados”). */
  const [customDatesTouchedInModal, setCustomDatesTouchedInModal] =
    useState(false);
  /** Fecha o modal de período antes do calendário e reabre depois (Android/iOS). */
  const reopenPeriodAfterDatePick = useRef(false);

  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterSubPicker, setFilterSubPicker] = useState<FilterSubPicker | null>(
    null,
  );
  const [filterKind, setFilterKind] = useState<GanttFilterKind>("all");
  const [filterValue, setFilterValue] = useState("");
  const [draftSearchText, setDraftSearchText] = useState("");

  const t = THEMES[theme];
  const categoryMap = { ...DEFAULT_CATEGORY_COLORS, ...categoryColorsProp };

  const uniqueAreas = useMemo(() => {
    const s = new Set<string>();
    for (const task of tasks) s.add(areaDisplayLabel(task));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [tasks]);

  const uniqueDirectories = useMemo(() => {
    const s = new Set<string>();
    for (const task of tasks) s.add(directoryDisplayLabel(task));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filterKind === "all") return tasks;
    if (filterKind === "area")
      return tasks.filter((x) => areaDisplayLabel(x) === filterValue);
    if (filterKind === "directory")
      return tasks.filter((x) => directoryDisplayLabel(x) === filterValue);
    if (filterKind === "search") {
      const q = filterValue.trim();
      if (!q) return tasks;
      return tasks.filter((x) => taskMatchesTextSearch(x, q));
    }
    return tasks;
  }, [tasks, filterKind, filterValue]);

  const closeFilterMenu = () => {
    setFilterSubPicker(null);
    setFilterMenuOpen(false);
  };

  const openFilterMenu = () => {
    setFilterSubPicker(null);
    setDraftSearchText(filterKind === "search" ? filterValue : "");
    setFilterMenuOpen(true);
  };

  const clearFilter = () => {
    setFilterKind("all");
    setFilterValue("");
    setDraftSearchText("");
    setFilterSubPicker(null);
    setFilterMenuOpen(false);
  };

  const applySearchFilter = () => {
    const q = draftSearchText.trim();
    if (!q) {
      Alert.alert("Busca", "Digite um trecho para filtrar (rota, pasta, área…).");
      return;
    }
    setFilterKind("search");
    setFilterValue(q);
    closeFilterMenu();
  };

  const areaDropdownLabel =
    filterKind === "area" && filterValue ? filterValue : "Selecionar área…";
  const directoryDropdownLabel =
    filterKind === "directory" && filterValue
      ? filterValue
      : "Selecionar diretório…";

  const openAreaPicker = () => {
    if (uniqueAreas.length === 0) {
      Alert.alert("Áreas", "Não há áreas nos dados do gráfico no momento.");
      return;
    }
    setFilterSubPicker("area");
  };

  const openDirectoryPicker = () => {
    if (uniqueDirectories.length === 0) {
      Alert.alert(
        "Diretórios",
        "Não há diretórios nos dados do gráfico no momento.",
      );
      return;
    }
    setFilterSubPicker("directory");
  };

  const selectAreaFromPicker = (label: string) => {
    setFilterKind("area");
    setFilterValue(label);
    setFilterSubPicker(null);
    setFilterMenuOpen(false);
  };

  const selectDirectoryFromPicker = (label: string) => {
    setFilterKind("directory");
    setFilterValue(label);
    setFilterSubPicker(null);
    setFilterMenuOpen(false);
  };

  const filterSummaryLabel =
    filterKind === "all"
      ? "Todas as rotas"
      : filterKind === "area"
        ? `Área: ${filterValue}`
        : filterKind === "directory"
          ? `Diretório: ${filterValue}`
          : filterValue.length > 28
            ? `Busca: ${filterValue.slice(0, 28)}…`
            : `Busca: ${filterValue}`;

  const today = startOfDay(new Date());

  let rangeStart: Date;
  let rangeEnd: Date;
  let visibleDayCount: number;

  if (customRangeActive) {
    rangeStart = startOfDay(new Date(customStart));
    rangeEnd = startOfDay(new Date(customEnd));
    if (rangeEnd < rangeStart) {
      const x = rangeStart;
      rangeStart = rangeEnd;
      rangeEnd = x;
    }
    visibleDayCount = Math.max(1, daysBetweenInclusive(rangeStart, rangeEnd));
  } else {
    const half = Math.floor(windowDays / 2);
    rangeStart = addDays(today, -half);
    rangeEnd = addDays(rangeStart, windowDays - 1);
    visibleDayCount = windowDays;
  }

  const rangeMs = Math.max(1, rangeEnd.getTime() - rangeStart.getTime());

  const ticks: Date[] = [];
  const stepDays = 7;
  for (
    let cur = new Date(rangeStart);
    cur <= rangeEnd;
    cur = addDays(cur, stepDays)
  ) {
    ticks.push(new Date(cur));
  }
  if (!ticks.length) ticks.push(rangeStart);

  const effectiveWidth = Math.max(320, visibleDayCount * pixelsPerDay);
  const timelinePlotWidth = effectiveWidth + TIMELINE_SIDE_PAD * 2;
  const scrollContentWidth = timelinePlotWidth + ROUTE_TAIL_PX;

  const openPeriodMenu = () => {
    if (customRangeActive) {
      setDraftCustomStart(startOfDay(new Date(customStart)));
      setDraftCustomEnd(startOfDay(new Date(customEnd)));
    } else {
      const halfW = Math.floor(windowDays / 2);
      const rs = addDays(today, -halfW);
      const re = addDays(rs, windowDays - 1);
      setDraftCustomStart(rs);
      setDraftCustomEnd(re);
    }
    setCustomDatesTouchedInModal(false);
    setPeriodMenuOpen(true);
  };

  const openDateField = (which: "from" | "to") => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Calendário",
        "Para escolher as datas, use o app no iOS ou Android.",
      );
      return;
    }
    setCustomDatesTouchedInModal(true);
    reopenPeriodAfterDatePick.current = true;
    setPeriodMenuOpen(false);
    InteractionManager.runAfterInteractions(() => {
      setDatePickerFor(which);
    });
  };

  const finishAndroidDatePicker = (
    event: { type?: string },
    date: Date | undefined,
    which: "from" | "to" | null,
  ) => {
    setDatePickerFor(null);
    const dismissed = event.type === "dismissed";
    const confirmed =
      !dismissed &&
      date != null &&
      which != null &&
      (event.type === "set" || event.type === undefined);
    if (confirmed) {
      const d = startOfDay(date);
      if (which === "from") setDraftCustomStart(d);
      else setDraftCustomEnd(d);
    }
    if (Platform.OS === "android" && reopenPeriodAfterDatePick.current) {
      reopenPeriodAfterDatePick.current = false;
      setTimeout(() => setPeriodMenuOpen(true), 350);
    }
  };

  const closeIosDatePicker = () => {
    setDatePickerFor(null);
    if (reopenPeriodAfterDatePick.current) {
      reopenPeriodAfterDatePick.current = false;
      setTimeout(() => setPeriodMenuOpen(true), 300);
    }
  };

  const applyCustomDateRange = () => {
    let s = startOfDay(new Date(draftCustomStart));
    let e = startOfDay(new Date(draftCustomEnd));
    if (e < s) {
      const tmp = s;
      s = e;
      e = tmp;
    }
    const span = daysBetweenInclusive(s, e);
    if (span > MAX_CUSTOM_RANGE_DAYS) {
      Alert.alert(
        "Intervalo muito grande",
        `Escolha no máximo ${MAX_CUSTOM_RANGE_DAYS} dias.`,
      );
      return;
    }
    setCustomStart(s);
    setCustomEnd(e);
    setCustomRangeActive(true);
    setCustomDatesTouchedInModal(false);
    setPeriodMenuOpen(false);
  };

  const periodSummaryLabel = customRangeActive
    ? `${formatDateFull(customStart)} – ${formatDateFull(customEnd)}`
    : `${windowDays} dias`;

  const todayX =
    TIMELINE_SIDE_PAD +
    ((today.getTime() - rangeStart.getTime()) / rangeMs) * effectiveWidth;

  const isEmptyFilter = filteredTasks.length === 0;
  const gridHeight = isEmptyFilter ? 88 : filteredTasks.length * ROW_H;

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <View style={styles.statusLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.statusSwatch, { backgroundColor: "#22c55e" }]} />
          <Text style={[styles.legendSmall, { color: t.muted }]}>No prazo</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.statusSwatch, { backgroundColor: "#ef4444" }]} />
          <Text style={[styles.legendSmall, { color: t.muted }]}>Atrasada</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.statusSwatch,
              { backgroundColor: "rgba(148,163,184,0.4)" },
            ]}
          />
          <Text style={[styles.legendSmall, { color: t.muted }]}>Futura</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.todayMini} />
          <Text style={[styles.legendSmall, { color: t.muted }]}>Hoje</Text>
        </View>
      </View>

      <View style={styles.periodRow}>
        <Text style={[styles.periodLabel, { color: t.muted }]}>Filtro</Text>
        <Pressable
          onPress={openFilterMenu}
          style={({ pressed }) => [
            styles.periodSelect,
            theme === "dark" ? styles.periodSelectDark : styles.periodSelectLight,
            pressed && styles.periodSelectPressed,
            styles.periodSelectFlex,
          ]}
        >
          <Text
            style={[
              styles.periodSelectValue,
              { color: theme === "dark" ? "#f1f5f9" : "#1a472a" },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {filterSummaryLabel}
          </Text>
          <Feather
            name="chevron-down"
            size={14}
            color={theme === "dark" ? "#94a3b8" : "#64748b"}
          />
        </Pressable>
      </View>

      <Modal
        visible={filterMenuOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (filterSubPicker) setFilterSubPicker(null);
          else closeFilterMenu();
        }}
      >
        <View style={styles.modalRoot} pointerEvents="box-none">
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (filterSubPicker) setFilterSubPicker(null);
              else closeFilterMenu();
            }}
          />
          <View style={styles.modalSheetOverlay} pointerEvents="box-none">
            <View
              style={[
                styles.modalSheet,
                filterSubPicker !== null && styles.filterPickerSheet,
                theme === "dark" ? styles.modalSheetDark : null,
              ]}
              pointerEvents="auto"
            >
              {filterSubPicker === null ? (
                <>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme === "dark" ? "#f8fafc" : "#0f172a" },
                    ]}
                  >
                    Filtrar gráfico
                  </Text>
                  <Text
                    style={[
                      styles.filterModalApplied,
                      {
                        color: theme === "dark" ? "#94a3b8" : "#64748b",
                      },
                    ]}
                    numberOfLines={3}
                  >
                    {filterSummaryLabel}
                  </Text>

                  <Pressable
                    onPress={clearFilter}
                    style={({ pressed }) => [
                      styles.modalOption,
                      styles.filterModalControlRow,
                      pressed && styles.modalOptionPressed,
                      filterKind === "all" && styles.modalOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        {
                          color:
                            filterKind === "all"
                              ? "#1a472a"
                              : theme === "dark"
                                ? "#e2e8f0"
                                : "#334155",
                        },
                      ]}
                    >
                      Todas as rotas
                    </Text>
                    {filterKind === "all" ? (
                      <Feather name="check" size={16} color="#1a472a" />
                    ) : (
                      <View style={{ width: 16 }} />
                    )}
                  </Pressable>

                  <View style={styles.modalSectionHeader}>
                    <Text
                      style={[
                        styles.modalSectionLabel,
                        { color: theme === "dark" ? "#94a3b8" : "#64748b" },
                      ]}
                    >
                      Por área
                    </Text>
                  </View>
                  <Pressable
                    onPress={openAreaPicker}
                    hitSlop={6}
                    android_ripple={
                      Platform.OS === "android"
                        ? { color: "rgba(26, 71, 42, 0.12)" }
                        : undefined
                    }
                    style={({ pressed }) => [
                      styles.modalDateRow,
                      styles.filterDropdownRowSingle,
                      theme === "dark" ? styles.modalDateRowDark : styles.modalDateRowLight,
                      pressed && styles.modalOptionPressed,
                      uniqueAreas.length === 0 && styles.filterDropdownDisabled,
                    ]}
                    disabled={uniqueAreas.length === 0}
                  >
                    <Text
                      style={[
                        styles.modalDateRowValue,
                        styles.filterDropdownValue,
                        {
                          color: theme === "dark" ? "#f8fafc" : "#0f172a",
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {areaDropdownLabel}
                    </Text>
                    <Feather
                      name="chevron-down"
                      size={18}
                      color={theme === "dark" ? "#94a3b8" : "#64748b"}
                    />
                  </Pressable>

                  <View style={[styles.modalSectionHeader, { paddingTop: 4 }]}>
                    <Text
                      style={[
                        styles.modalSectionLabel,
                        { color: theme === "dark" ? "#94a3b8" : "#64748b" },
                      ]}
                    >
                      Por diretório
                    </Text>
                  </View>
                  <Pressable
                    onPress={openDirectoryPicker}
                    hitSlop={6}
                    android_ripple={
                      Platform.OS === "android"
                        ? { color: "rgba(26, 71, 42, 0.12)" }
                        : undefined
                    }
                    style={({ pressed }) => [
                      styles.modalDateRow,
                      styles.filterDropdownRowSingle,
                      theme === "dark" ? styles.modalDateRowDark : styles.modalDateRowLight,
                      pressed && styles.modalOptionPressed,
                      uniqueDirectories.length === 0 && styles.filterDropdownDisabled,
                    ]}
                    disabled={uniqueDirectories.length === 0}
                  >
                    <Text
                      style={[
                        styles.modalDateRowValue,
                        styles.filterDropdownValue,
                        {
                          color: theme === "dark" ? "#f8fafc" : "#0f172a",
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {directoryDropdownLabel}
                    </Text>
                    <Feather
                      name="chevron-down"
                      size={18}
                      color={theme === "dark" ? "#94a3b8" : "#64748b"}
                    />
                  </Pressable>

                  <View style={styles.modalSectionHeader}>
                    <Text
                      style={[
                        styles.modalSectionLabel,
                        { color: theme === "dark" ? "#94a3b8" : "#64748b" },
                      ]}
                    >
                      Buscar por texto
                    </Text>
                    <Text
                      style={[
                        styles.modalSectionHint,
                        {
                          color:
                            theme === "dark" ? "#64748b" : "#94a3b8",
                        },
                      ]}
                    >
                      Rota, diretório, área ou nome da tarefa
                    </Text>
                  </View>
                  <TextInput
                    value={draftSearchText}
                    onChangeText={setDraftSearchText}
                    placeholder="Ex.: nome da rota…"
                    placeholderTextColor={
                      theme === "dark" ? "#64748b" : "#94a3b8"
                    }
                    style={[
                      styles.filterSearchInput,
                      theme === "dark"
                        ? styles.filterSearchInputDark
                        : styles.filterSearchInputLight,
                      { color: theme === "dark" ? "#f8fafc" : "#0f172a" },
                    ]}
                    returnKeyType="search"
                    onSubmitEditing={applySearchFilter}
                  />
                  <Pressable
                    onPress={applySearchFilter}
                    style={({ pressed }) => [
                      styles.modalApplyBtn,
                      { marginTop: 8 },
                      pressed && styles.modalApplyBtnPressed,
                    ]}
                  >
                    <Text style={styles.modalApplyBtnText}>Aplicar busca por texto</Text>
                  </Pressable>
                  <Pressable
                    onPress={closeFilterMenu}
                    style={({ pressed }) => [
                      styles.filterCloseBtn,
                      pressed && styles.modalOptionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCloseBtnText,
                        { color: theme === "dark" ? "#94a3b8" : "#64748b" },
                      ]}
                    >
                      Fechar
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme === "dark" ? "#f8fafc" : "#0f172a" },
                    ]}
                  >
                    {filterSubPicker === "directory"
                      ? "Selecionar diretório"
                      : "Selecionar área"}
                  </Text>
                  <ScrollView
                    style={styles.filterPickerScroll}
                    contentContainerStyle={styles.filterPickerScrollContent}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  >
                    {filterSubPicker === "area"
                      ? uniqueAreas.map((label) => {
                          const selected =
                            filterKind === "area" && filterValue === label;
                          return (
                            <Pressable
                              key={`pick-area-${label}`}
                              onPress={() => selectAreaFromPicker(label)}
                              style={({ pressed }) => [
                                styles.modalOption,
                                pressed && styles.modalOptionPressed,
                                selected && styles.modalOptionSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.modalOptionText,
                                  styles.filterOptionTextShrink,
                                  {
                                    color: selected
                                      ? "#1a472a"
                                      : theme === "dark"
                                        ? "#e2e8f0"
                                        : "#334155",
                                  },
                                ]}
                                numberOfLines={2}
                              >
                                {label}
                              </Text>
                              {selected ? (
                                <Feather name="check" size={16} color="#1a472a" />
                              ) : (
                                <View style={{ width: 16 }} />
                              )}
                            </Pressable>
                          );
                        })
                      : uniqueDirectories.map((label) => {
                          const selected =
                            filterKind === "directory" && filterValue === label;
                          return (
                            <Pressable
                              key={`pick-dir-${label}`}
                              onPress={() => selectDirectoryFromPicker(label)}
                              style={({ pressed }) => [
                                styles.modalOption,
                                pressed && styles.modalOptionPressed,
                                selected && styles.modalOptionSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.modalOptionText,
                                  styles.filterOptionTextShrink,
                                  {
                                    color: selected
                                      ? "#1a472a"
                                      : theme === "dark"
                                        ? "#e2e8f0"
                                        : "#334155",
                                  },
                                ]}
                                numberOfLines={2}
                              >
                                {label}
                              </Text>
                              {selected ? (
                                <Feather name="check" size={16} color="#1a472a" />
                              ) : (
                                <View style={{ width: 16 }} />
                              )}
                            </Pressable>
                          );
                        })}
                  </ScrollView>
                  <Pressable
                    onPress={() => setFilterSubPicker(null)}
                    style={({ pressed }) => [
                      styles.filterPickerBackBtn,
                      theme === "dark"
                        ? styles.filterPickerBackBtnDark
                        : styles.filterPickerBackBtnLight,
                      pressed && styles.modalOptionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPickerBackBtnText,
                        {
                          color: theme === "dark" ? "#e2e8f0" : "#334155",
                        },
                      ]}
                    >
                      Voltar
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.periodRow}>
        <Text style={[styles.periodLabel, { color: t.muted }]}>Período visível</Text>
        <Pressable
          onPress={openPeriodMenu}
          style={({ pressed }) => [
            styles.periodSelect,
            theme === "dark" ? styles.periodSelectDark : styles.periodSelectLight,
            pressed && styles.periodSelectPressed,
            styles.periodSelectFlex,
          ]}
        >
          <Text
            style={[
              styles.periodSelectValue,
              { color: theme === "dark" ? "#f1f5f9" : "#1a472a" },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {periodSummaryLabel}
          </Text>
          <Feather
            name="chevron-down"
            size={14}
            color={theme === "dark" ? "#94a3b8" : "#64748b"}
          />
        </Pressable>
      </View>

      <Modal
        visible={periodMenuOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPeriodMenuOpen(false)}
      >
        <View style={styles.modalRoot} pointerEvents="box-none">
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setPeriodMenuOpen(false)}
          />
          <View
            style={styles.modalSheetOverlay}
            pointerEvents="box-none"
          >
            <View
              style={[
                styles.modalSheet,
                theme === "dark" ? styles.modalSheetDark : null,
              ]}
              pointerEvents="auto"
            >
            <Text
              style={[
                styles.modalTitle,
                { color: theme === "dark" ? "#f8fafc" : "#0f172a" },
              ]}
            >
              Período visível
            </Text>
            {windowPresets.map((d) => {
              const selected =
                !customRangeActive &&
                !customDatesTouchedInModal &&
                windowDays === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => {
                    setWindowDays(d);
                    setCustomRangeActive(false);
                    setCustomDatesTouchedInModal(false);
                    setPeriodMenuOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.modalOption,
                    pressed && styles.modalOptionPressed,
                    selected && styles.modalOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      {
                        color: selected
                          ? "#1a472a"
                          : theme === "dark"
                            ? "#e2e8f0"
                            : "#334155",
                      },
                    ]}
                  >
                    {d} dias
                  </Text>
                  {selected ? (
                    <Feather name="check" size={16} color="#1a472a" />
                  ) : (
                    <View style={{ width: 16 }} />
                  )}
                </Pressable>
              );
            })}

            <View style={styles.modalSectionHeader}>
              <Text
                style={[
                  styles.modalSectionLabel,
                  { color: theme === "dark" ? "#94a3b8" : "#64748b" },
                ]}
              >
                Ou escolha duas datas
              </Text>
              <Text
                style={[
                  styles.modalSectionHint,
                  {
                    color:
                      theme === "dark" ? "#64748b" : "#94a3b8",
                  },
                ]}
              >
                (no máximo {MAX_CUSTOM_RANGE_DAYS} dias)
              </Text>
            </View>

            <Pressable
              onPress={() => openDateField("from")}
              style={({ pressed }) => [
                styles.modalDateRow,
                theme === "dark" ? styles.modalDateRowDark : styles.modalDateRowLight,
                pressed && styles.modalOptionPressed,
              ]}
            >
              <Text
                style={[
                  styles.modalDateRowLabel,
                  { color: theme === "dark" ? "#94a3b8" : "#64748b" },
                ]}
              >
                De
              </Text>
              <Text
                style={[
                  styles.modalDateRowValue,
                  { color: theme === "dark" ? "#f8fafc" : "#0f172a" },
                ]}
              >
                {formatDateFull(draftCustomStart)}
              </Text>
              <Feather
                name="calendar"
                size={16}
                color={theme === "dark" ? "#94a3b8" : "#64748b"}
              />
            </Pressable>

            <Pressable
              onPress={() => openDateField("to")}
              style={({ pressed }) => [
                styles.modalDateRow,
                theme === "dark" ? styles.modalDateRowDark : styles.modalDateRowLight,
                pressed && styles.modalOptionPressed,
              ]}
            >
              <Text
                style={[
                  styles.modalDateRowLabel,
                  { color: theme === "dark" ? "#94a3b8" : "#64748b" },
                ]}
              >
                Até
              </Text>
              <Text
                style={[
                  styles.modalDateRowValue,
                  { color: theme === "dark" ? "#f8fafc" : "#0f172a" },
                ]}
              >
                {formatDateFull(draftCustomEnd)}
              </Text>
              <Feather
                name="calendar"
                size={16}
                color={theme === "dark" ? "#94a3b8" : "#64748b"}
              />
            </Pressable>

            <Pressable
              onPress={applyCustomDateRange}
              style={({ pressed }) => [
                styles.modalApplyBtn,
                pressed && styles.modalApplyBtnPressed,
              ]}
            >
              <Text style={styles.modalApplyBtnText}>Aplicar intervalo</Text>
            </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {datePickerFor !== null && Platform.OS === "ios" && (
        <Modal
          transparent
          animationType="slide"
          visible={!!datePickerFor}
          statusBarTranslucent
          onRequestClose={closeIosDatePicker}
        >
          <View style={styles.iosPickerRoot}>
            <Pressable
              style={styles.iosPickerBackdrop}
              onPress={closeIosDatePicker}
            />
            <View
              style={[
                styles.iosPickerSheet,
                theme === "dark" ? styles.iosPickerSheetDark : null,
              ]}
            >
              <View style={styles.iosPickerToolbar}>
                <Pressable onPress={closeIosDatePicker} hitSlop={12}>
                  <Text
                    style={[
                      styles.iosPickerDone,
                      { color: theme === "dark" ? "#4ade80" : "#1a472a" },
                    ]}
                  >
                    Concluir
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={
                  datePickerFor === "from"
                    ? draftCustomStart
                    : draftCustomEnd
                }
                mode="date"
                display="spinner"
                themeVariant={theme === "dark" ? "dark" : "light"}
                onChange={(_, date) => {
                  if (!date) return;
                  const d = startOfDay(date);
                  if (datePickerFor === "from") setDraftCustomStart(d);
                  else setDraftCustomEnd(d);
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {datePickerFor !== null && Platform.OS === "android" && (
        <DateTimePicker
          value={
            datePickerFor === "from" ? draftCustomStart : draftCustomEnd
          }
          mode="date"
          display="default"
          onChange={(event, date) => {
            const which = datePickerFor;
            finishAndroidDatePicker(event, date ?? undefined, which);
          }}
        />
      )}

      <View style={styles.splitRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          nestedScrollEnabled
          style={styles.timelineScroll}
          contentContainerStyle={styles.timelineScrollContent}
        >
          <View style={{ width: scrollContentWidth }}>
            <View style={[styles.todayStrip, { width: timelinePlotWidth, height: TODAY_STRIP_H }]}>
              {todayX >= 0 && todayX <= timelinePlotWidth && (
                <Text style={[styles.todayLabel, { left: todayX - 14 }]}>
                  HOJE
                </Text>
              )}
            </View>
            <View
              style={{
                position: "relative",
                height: gridHeight,
                width: scrollContentWidth,
              }}
            >
              <Svg
                width={timelinePlotWidth}
                height={gridHeight}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              >
                {ticks.map((d) => {
                  const x =
                    TIMELINE_SIDE_PAD +
                    ((d.getTime() - rangeStart.getTime()) / rangeMs) *
                      effectiveWidth;
                  return (
                    <Line
                      key={d.toISOString()}
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={gridHeight}
                      stroke={t.grid}
                      strokeWidth={1}
                    />
                  );
                })}
              </Svg>

              {isEmptyFilter ? (
                <View
                  style={[
                    styles.emptyFilterWrap,
                    { height: gridHeight, width: scrollContentWidth },
                  ]}
                >
                  <Text
                    style={[
                      styles.emptyFilterText,
                      { color: t.muted },
                    ]}
                  >
                    Nenhuma rota corresponde ao filtro.
                  </Text>
                </View>
              ) : (
                filteredTasks.map((task, index) => (
                  <View
                    key={task.id}
                    style={[styles.barRowAbsolute, { top: index * ROW_H }]}
                  >
                    <GanttBarRow
                      task={task}
                      timelineWidth={effectiveWidth}
                      timelineOffsetX={TIMELINE_SIDE_PAD}
                      rangeStart={rangeStart}
                      rangeEnd={rangeEnd}
                      today={today}
                      theme={theme}
                      onPress={onTaskPress}
                    />
                  </View>
                ))
              )}

              {todayX >= 0 && todayX <= timelinePlotWidth && (
                <Svg
                  width={timelinePlotWidth}
                  height={gridHeight}
                  style={styles.todayLineOverlay}
                  pointerEvents="none"
                >
                  <Line
                    x1={todayX}
                    y1={0}
                    x2={todayX}
                    y2={gridHeight}
                    stroke="#eab308"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                </Svg>
              )}
            </View>

            <View style={[styles.axisRow, { width: timelinePlotWidth }]}>
              {ticks.map((d) => {
                const x =
                  TIMELINE_SIDE_PAD +
                  ((d.getTime() - rangeStart.getTime()) / rangeMs) *
                  effectiveWidth;
                return (
                  <Text
                    key={`ax-${d.toISOString()}`}
                    style={[
                      styles.axisLabel,
                      { color: t.muted, left: x - AXIS_LABEL_HALF_W },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="clip"
                  >
                    {formatAxisDate(d)}
                  </Text>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 200,
    width: "100%",
    alignSelf: "stretch",
  },
  statusLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    rowGap: 6,
    marginBottom: 10,
    justifyContent: "flex-start",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSmall: {
    fontSize: 10,
  },
  statusSwatch: {
    width: 14,
    height: 8,
    borderRadius: 2,
  },
  todayMini: {
    width: 12,
    height: 2,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#eab308",
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  periodLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  periodSelect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 76,
    justifyContent: "space-between",
  },
  periodSelectFlex: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },
  periodSelectLight: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  periodSelectDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  periodSelectPressed: {
    opacity: 0.88,
  },
  periodSelectValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalRoot: {
    flex: 1,
    position: "relative",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    zIndex: 0,
  },
  modalSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    zIndex: 2,
    elevation: 20,
  },
  modalSheet: {
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 4,
    maxWidth: 400,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  modalSheetDark: {
    backgroundColor: "#1e293b",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  filterModalApplied: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalOptionPressed: {
    backgroundColor: "rgba(26, 71, 42, 0.06)",
  },
  modalOptionSelected: {
    backgroundColor: "rgba(26, 71, 42, 0.1)",
  },
  /**
   * No modal Filtrar gráfico: mesma largura dos selects/campo (margin + padding
   * iguais ao `modalDateRow` / `filterSearchInput`).
   */
  filterModalControlRow: {
    marginHorizontal: 12,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalSectionHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  modalSectionHint: {
    fontSize: 10,
    fontWeight: "500",
  },
  modalDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 12,
  },
  modalDateRowLight: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalDateRowDark: {
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    borderWidth: 1,
    borderColor: "#334155",
  },
  modalDateRowLabel: {
    fontSize: 14,
    fontWeight: "600",
    width: 36,
  },
  modalDateRowValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  modalApplyBtn: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1a472a",
    alignItems: "center",
  },
  modalApplyBtnPressed: {
    opacity: 0.9,
  },
  modalApplyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  iosPickerRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  iosPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  iosPickerSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 28,
  },
  iosPickerSheetDark: {
    backgroundColor: "#1e293b",
  },
  iosPickerToolbar: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148,163,184,0.35)",
  },
  iosPickerDone: {
    fontSize: 16,
    fontWeight: "700",
  },
  splitRow: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  timelineScroll: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  timelineScrollContent: {
    flexGrow: 1,
    paddingBottom: 4,
  },
  barRow: {
    justifyContent: "center",
  },
  barRowPressed: {
    opacity: 0.78,
  },
  barRowAbsolute: {
    position: "absolute",
    left: 0,
    right: 0,
    height: ROW_H,
    justifyContent: "center",
    zIndex: 20,
    elevation: 4,
  },
  todayLineOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 8,
  },
  trackArea: {
    position: "relative",
    justifyContent: "flex-start",
  },
  fullTrack: {
    position: "absolute",
    height: BAR_H,
    borderRadius: 4,
    overflow: "visible",
  },
  progressFill: {
    height: BAR_H,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  progressPctFloating: {
    position: "absolute",
    top: Math.max(0, Math.floor((BAR_H - 13) / 2)),
    fontSize: 9,
    fontWeight: "800",
    zIndex: 4,
    minWidth: 28,
  },
  progressPctOnGreen: {
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressPctOnTrack: {
    color: "#0f172a",
    textAlign: "left",
  },
  routeAtBarEnd: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
  },
  metaRow: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    gap: 6,
  },
  metaText: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 12,
  },
  metaWarning: {
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 12,
    color: "#ef4444",
    backgroundColor: "rgba(239,68,68,0.12)",
    borderRadius: 8,
    overflow: "hidden",
    paddingHorizontal: 6,
  },
  todayStrip: {
    position: "relative",
    marginBottom: 2,
  },
  todayLabel: {
    position: "absolute",
    top: 0,
    fontSize: 9,
    fontWeight: "800",
    color: "#ea580c",
    letterSpacing: 0.5,
  },
  axisRow: {
    height: AXIS_H,
    position: "relative",
    marginTop: 4,
  },
  axisLabel: {
    position: "absolute",
    top: 0,
    fontSize: 9,
    lineHeight: 11,
    width: AXIS_LABEL_W,
    textAlign: "center",
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: "center" as const },
    }),
  },
  /** Linha do “select”: só valor + chevron (sem rótulo à esquerda). */
  filterDropdownRowSingle: {
    justifyContent: "space-between",
    gap: 8,
  },
  filterDropdownValue: {
    flex: 1,
    minWidth: 0,
  },
  filterDropdownDisabled: {
    opacity: 0.45,
  },
  filterPickerSheet: {
    maxHeight: "78%",
    width: "100%",
    maxWidth: 400,
  },
  filterPickerScroll: {
    maxHeight: 360,
    marginHorizontal: 4,
  },
  filterPickerScrollContent: {
    paddingBottom: 8,
  },
  filterPickerBackBtn: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  filterPickerBackBtnLight: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterPickerBackBtnDark: {
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    borderWidth: 1,
    borderColor: "#334155",
  },
  filterPickerBackBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  filterOptionTextShrink: {
    flex: 1,
    minWidth: 0,
  },
  filterSearchInput: {
    marginHorizontal: 12,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    fontSize: 15,
    fontWeight: "600",
  },
  filterSearchInputLight: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterSearchInputDark: {
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    borderWidth: 1,
    borderColor: "#334155",
  },
  filterCloseBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 4,
  },
  filterCloseBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptyFilterWrap: {
    position: "absolute",
    left: 0,
    top: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 25,
  },
  emptyFilterText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
