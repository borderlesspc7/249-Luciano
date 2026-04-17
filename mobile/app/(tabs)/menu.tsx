import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { CommissioningGanttChart } from "../../components/CommissioningGanttChart/CommissioningGanttChart";
import { useForwardedChecklists } from "../../contexts/ForwardedChecklistsContext";
import { useChecklistDrafts } from "../../contexts/ChecklistDraftsContext";
import { useChecklistFolders } from "../../contexts/ChecklistFoldersContext";
import { useProject } from "../../contexts/ProjectContext";
import { buildGanttTasksFromChecklists, projectsMatch } from "../../utils/forwardedToGanttTasks";

const { width, height } = Dimensions.get("window");

type RouteStatus = "nao_iniciada" | "em_andamento" | "atrasado" | "concluida";

const ROUTE_STATUS_META: Record<RouteStatus, { label: string; color: string }> = {
  nao_iniciada: { label: "Não iniciada", color: "#ef4444" },
  em_andamento: { label: "Em andamento", color: "#10b981" },
  atrasado: { label: "Em atraso", color: "#f59e0b" },
  concluida: { label: "Concluída", color: "#6366f1" },
};

type RouteSummary = {
  id: string;
  area: string;
  directory: string;
  route: string;
  status: RouteStatus;
};

function formatIsoDate(v: string | Date): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

function getTaskStatus(
  task: { percentual_concluido: number; data_inicio: string | Date; data_fim: string | Date },
  todayIso: string
): RouteStatus {
  const pct = Math.max(0, Math.min(100, task.percentual_concluido ?? 0));
  const startIso = formatIsoDate(task.data_inicio);
  const endIso = formatIsoDate(task.data_fim);

  if (pct >= 100) return "concluida";
  if (todayIso > endIso) return "atrasado";
  if (pct <= 0 || todayIso < startIso) return "nao_iniciada";
  return "em_andamento";
}

function useProjectTasks() {
  const { user } = useAuth();
  const { items } = useForwardedChecklists();
  const { items: drafts } = useChecklistDrafts();
  const { items: folders } = useChecklistFolders();
  const { currentProject } = useProject();

  const existingFolderNamesLower = useMemo(() => {
    const set = new Set<string>();
    for (const f of folders) {
      if (projectsMatch(f.projectName, currentProject)) {
        const n = f.name?.trim().toLowerCase();
        if (n) set.add(n);
      }
    }
    return set;
  }, [folders, currentProject]);

  const folderAreaNameByFolderLower = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of folders) {
      if (!projectsMatch(f.projectName, currentProject)) continue;
      const folderName = f.name?.trim().toLowerCase();
      const areaName = f.areaName?.trim();
      if (folderName && areaName) map.set(folderName, areaName);
    }
    return map;
  }, [folders, currentProject]);

  const ganttOptions = useMemo(
    () => ({
      projectName: currentProject,
      userId: user?.uid,
      existingFolderNamesLower,
      folderAreaNameByFolderLower,
    }),
    [currentProject, user?.uid, existingFolderNamesLower, folderAreaNameByFolderLower]
  );

  const tasks = useMemo(
    () => buildGanttTasksFromChecklists(drafts, items, ganttOptions),
    [drafts, items, ganttOptions]
  );

  return { tasks, existingFolderNamesLower, currentProject };
}

function ForwardedGanttChartBlock() {
  const { tasks, existingFolderNamesLower, currentProject } = useProjectTasks();
  const router = useRouter();

  const folderCountForProject = existingFolderNamesLower.size;

  if (tasks.length === 0) {
    return (
      <View style={styles.ganttChartWrap}>
        <Text style={styles.ganttEmpty}>
          {folderCountForProject === 0
            ? "Nenhuma pasta neste projeto. Crie em Áreas."
            : "Nada para exibir. Salve o checklist ou conclua a rota."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.ganttChartWrap}>
      <CommissioningGanttChart
        tasks={tasks}
        defaultWindowDays={45}
        theme="light"
        onTaskPress={(task) => {
          const routeName = task.nomeRota?.trim() || task.nome?.trim();
          const folderName = task.nomeDiretorio?.trim();
          router.push({
            pathname: "/commissioning-checklist",
            params: {
              projectName: currentProject ?? undefined,
              routeName,
              folderName: folderName && folderName !== "Sem diretório" ? folderName : undefined,
              draftId: task.draftId,
              startDate:
                typeof task.data_inicio === "string"
                  ? task.data_inicio
                  : task.data_inicio.toISOString(),
              endDate:
                typeof task.data_fim === "string"
                  ? task.data_fim
                  : task.data_fim.toISOString(),
            },
          });
        }}
      />
    </View>
  );
}

function FilterDropdown({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: string[];
  selected: string;
  onSelect: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.filterSelectWrap}>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.dropdownTrigger,
          pressed && styles.dropdownTriggerPressed,
        ]}
      >
        <Text style={styles.dropdownTriggerText} numberOfLines={1}>
          {selected}
        </Text>
        <Text style={styles.dropdownChevron}>▼</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)} />
          <View style={styles.dropdownModalSheet}>
            <Text style={styles.dropdownModalTitle}>{title}</Text>
            <ScrollView style={styles.dropdownOptionsScroll} showsVerticalScrollIndicator>
              {options.map((option) => {
                const active = selected === option;
                return (
                  <Pressable
                    key={option}
                    style={({ pressed }) => [
                      styles.dropdownOption,
                      active && styles.dropdownOptionActive,
                      pressed && styles.dropdownOptionPressed,
                    ]}
                    onPress={() => {
                      onSelect(option);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownOptionText, active && styles.dropdownOptionTextActive]}>
                      {option}
                    </Text>
                    {active ? <Text style={styles.dropdownCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RoutesStatusDonutBlock() {
  const { tasks } = useProjectTasks();
  const [selectedArea, setSelectedArea] = useState("Todas");
  const [selectedDirectory, setSelectedDirectory] = useState("Todos");
  const [selectedRoute, setSelectedRoute] = useState("Todas");
  const todayIso = new Date().toISOString().slice(0, 10);

  const routes = useMemo<RouteSummary[]>(
    () =>
      tasks.map((task) => ({
        id: task.id,
        area: task.nomeArea?.trim() || "Sem área",
        directory: task.nomeDiretorio?.trim() || "Sem diretório",
        route: task.nomeRota?.trim() || task.nome?.trim() || "Sem rota",
        status: getTaskStatus(task, todayIso),
      })),
    [tasks, todayIso]
  );

  const areas = useMemo(
    () => ["Todas", ...Array.from(new Set(routes.map((r) => r.area))).sort((a, b) => a.localeCompare(b, "pt-BR"))],
    [routes]
  );

  const directories = useMemo(() => {
    const byArea = selectedArea === "Todas" ? routes : routes.filter((r) => r.area === selectedArea);
    return ["Todos", ...Array.from(new Set(byArea.map((r) => r.directory))).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [routes, selectedArea]);

  const routeNames = useMemo(() => {
    const byArea = selectedArea === "Todas" ? routes : routes.filter((r) => r.area === selectedArea);
    const byDirectory = selectedDirectory === "Todos" ? byArea : byArea.filter((r) => r.directory === selectedDirectory);
    return ["Todas", ...Array.from(new Set(byDirectory.map((r) => r.route))).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [routes, selectedArea, selectedDirectory]);

  const filteredRoutes = useMemo(
    () =>
      routes.filter((r) => {
        if (selectedArea !== "Todas" && r.area !== selectedArea) return false;
        if (selectedDirectory !== "Todos" && r.directory !== selectedDirectory) return false;
        if (selectedRoute !== "Todas" && r.route !== selectedRoute) return false;
        return true;
      }),
    [routes, selectedArea, selectedDirectory, selectedRoute]
  );

  const counters = useMemo(() => {
    const base: Record<RouteStatus, number> = {
      nao_iniciada: 0,
      em_andamento: 0,
      atrasado: 0,
      concluida: 0,
    };
    for (const item of filteredRoutes) base[item.status] += 1;
    return base;
  }, [filteredRoutes]);

  const total = filteredRoutes.length;
  const size = 204;
  const stroke = 24;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <View style={styles.donutWrap}>
      <View style={styles.statusLegend}>
        {(Object.keys(ROUTE_STATUS_META) as RouteStatus[]).map((status) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.statusSwatch, { backgroundColor: ROUTE_STATUS_META[status].color }]} />
            <Text style={styles.legendSmall}>{ROUTE_STATUS_META[status].label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.filterSelectRow}>
        <Text style={styles.filterSelectLabel}>Área</Text>
        <FilterDropdown
          title="Área"
          options={areas}
          selected={selectedArea}
          onSelect={(next) => {
            setSelectedArea(next);
            setSelectedDirectory("Todos");
            setSelectedRoute("Todas");
          }}
        />
      </View>

      <View style={styles.filterSelectRow}>
        <Text style={styles.filterSelectLabel}>Diretório</Text>
        <FilterDropdown
          title="Diretório"
          options={directories}
          selected={selectedDirectory}
          onSelect={(next) => {
            setSelectedDirectory(next);
            setSelectedRoute("Todas");
          }}
        />
      </View>

      <View style={styles.filterSelectRow}>
        <Text style={styles.filterSelectLabel}>Rota</Text>
        <FilterDropdown title="Rota" options={routeNames} selected={selectedRoute} onSelect={setSelectedRoute} />
      </View>

      <View style={styles.donutBody}>
        {total === 0 ? (
          <Text style={styles.ganttEmpty}>Nenhuma rota encontrada para os filtros selecionados.</Text>
        ) : (
          <>
            <View style={styles.donutChartBlock}>
              <Svg width={size} height={size}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#e5e7eb"
                  strokeWidth={stroke}
                  fill="none"
                />
                {(Object.keys(ROUTE_STATUS_META) as RouteStatus[]).map((status) => {
                  const ratio = counters[status] / total;
                  const segmentLength = ratio * circumference;
                  const circle = (
                    <Circle
                      key={status}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={ROUTE_STATUS_META[status].color}
                      strokeWidth={stroke}
                      strokeLinecap="butt"
                      fill="none"
                      strokeDasharray={`${segmentLength} ${circumference}`}
                      strokeDashoffset={-offset}
                      transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                  );
                  offset += segmentLength;
                  return circle;
                })}
              </Svg>
              <View style={styles.donutCenter}>
                <Text style={styles.donutCenterValue}>{total}</Text>
                <Text style={styles.donutCenterLabel}>Rotas</Text>
              </View>
            </View>
            <View style={styles.pieLegend}>
              {(Object.keys(ROUTE_STATUS_META) as RouteStatus[]).map((status) => {
                const count = counters[status];
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <View key={status} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: ROUTE_STATUS_META[status].color }]} />
                    <Text style={styles.legendLabel}>
                      {ROUTE_STATUS_META[status].label}: {count} ({pct.toFixed(0)}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>

    </View>
  );
}

const chartCards = [
  {
    id: "activities",
    title: "Timeline",
  },
  {
    id: "routeStatus",
    title: "Routes Over View",
  },
  {
    id: "actionsOverview",
    title: "Actions Over View",
  },
];

function ActionsOverviewPlaceholder() {
  return (
    <View style={styles.ganttChartWrap}>
      <Text style={styles.ganttEmpty}>
        Esta visão será preenchida em breve com o resumo das ações.
      </Text>
    </View>
  );
}

function renderChartContent(id: string, value?: number) {
  switch (id) {
    case "activities":
      return <ForwardedGanttChartBlock />;
    case "routeStatus":
      return <RoutesStatusDonutBlock />;
    case "actionsOverview":
      return <ActionsOverviewPlaceholder />;
    default:
      return null;
  }
}

export default function MenuScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Olá, {user?.name ?? "Usuário"}</Text>
        <Text style={styles.subtitle}>
          Deslize para o lado para ver os gráficos do dashboard.
        </Text>
      </View>

      <FlatList
        data={chartCards}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        snapToInterval={width}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        style={styles.chartsList}
        contentContainerStyle={styles.chartsContainer}
        renderItem={({ item }) => (
          <View style={[styles.chartCard, { width, height: height - 220 }]}>
            <Text style={styles.chartTitle}>{item.title}</Text>
            {typeof item.value === "number" &&
              item.id !== "routeStatus" && (
                <Text style={styles.chartValue}>
                  {item.value.toFixed(2).replace(".", ",")}%
                </Text>
              )}
            {"description" in item && item.description ? (
              <Text style={styles.chartDescription}>{item.description}</Text>
            ) : null}
            <View
              style={[
                styles.chartArea,
                (item.id === "routeStatus" || item.id === "actionsOverview") &&
                  styles.chartAreaTop,
              ]}
            >
              {renderChartContent(item.id, item.value)}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 24,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingHorizontal: 16,
  },
  welcome: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a472a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  chartsList: {
    flex: 1,
  },
  chartsContainer: {
    alignItems: "stretch",
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  chartValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a472a",
    marginBottom: 4,
  },
  chartDescription: {
    fontSize: 13,
    color: "#777",
    marginBottom: 8,
  },
  chartArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
    paddingTop: 12,
    minHeight: 0,
  },
  chartAreaTop: {
    justifyContent: "flex-start",
    paddingTop: 0,
  },
  ganttChartWrap: {
    flex: 1,
    minHeight: 0,
    alignSelf: "stretch",
    justifyContent: "flex-start",
  },
  ganttEmpty: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    paddingHorizontal: 8,
    paddingVertical: 16,
    textAlign: "center",
  },
  donutWrap: { width: "100%", marginTop: 4, gap: 8 },
  donutBody: {
    flex: 1,
    minHeight: 0,
  },
  statusLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusSwatch: { width: 10, height: 10, borderRadius: 5 },
  legendSmall: { fontSize: 12, color: "#64748b" },
  filterSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    flexShrink: 0,
  },
  filterSelectLabel: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  filterSelectWrap: { flex: 1, minWidth: 0, marginLeft: 8 },
  dropdownTrigger: {
    minHeight: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownTriggerPressed: { opacity: 0.9 },
  dropdownTriggerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#1a472a",
    marginRight: 8,
  },
  dropdownChevron: { fontSize: 11, color: "#64748b" },
  modalRoot: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdownModalSheet: {
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  dropdownModalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  dropdownOptionsScroll: { maxHeight: 320 },
  dropdownOption: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  dropdownOptionActive: {
    backgroundColor: "#ecfdf3",
  },
  dropdownOptionPressed: { opacity: 0.8 },
  dropdownOptionText: { fontSize: 14, color: "#334155", flex: 1, marginRight: 10 },
  dropdownOptionTextActive: { color: "#14532d", fontWeight: "600" },
  dropdownCheck: { fontSize: 14, color: "#14532d", fontWeight: "700" },
  donutChartBlock: {
    flex: 0,
    minHeight: 210,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 92,
    marginBottom: 0,
  },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenterValue: { fontSize: 24, fontWeight: "700", color: "#111827" },
  donutCenterLabel: { fontSize: 12, color: "#6b7280" },
  pieLegend: {
    width: "100%",
    marginBottom: 0,
    gap: 6,
    alignSelf: "stretch",
    marginTop: 72,
    paddingTop: 2,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 20 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 12, lineHeight: 17, color: "#374151", flex: 1, flexWrap: "wrap" },
});
