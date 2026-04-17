/** Categorias de engenharia (chaves estáveis para API). */
export type GanttTaskCategory =
  | "eletrica"
  | "instrumentacao"
  | "mecanica"
  | "automacao"
  | "utilidades"
  | string;

export interface GanttTask {
  id: string;
  nome: string;
  nomeArea?: string;
  nomeDiretorio?: string;
  draftId?: string;
  responsavel: string;
  categoria: GanttTaskCategory;
  /** Nome da rota — ao final da barra de progresso */
  nomeRota?: string;
  /** ISO string ou Date */
  data_inicio: string | Date;
  /** ISO string ou Date */
  data_fim: string | Date;
  /** 0–100 */
  percentual_concluido: number;
}

export type GanttTheme = "light" | "dark";

export interface CommissioningGanttChartProps {
  tasks: GanttTask[];
  /** Dias visíveis na janela (eixo X), centrados em hoje. Default 45 */
  defaultWindowDays?: number;
  /** Opções rápidas em dias (modal). Default [14, 30, 45, 60, 90]. Intervalo customizado: duas datas no mesmo modal */
  windowPresets?: number[];
  theme?: GanttTheme;
  /** Largura mínima da área da timeline (px); cresce com windowDays * pixelsPerDay */
  pixelsPerDay?: number;
  /** Cores por categoria (sobrescreve o mapa padrão) */
  categoryColors?: Partial<Record<string, string>>;
  onTaskPress?: (task: GanttTask) => void;
}
