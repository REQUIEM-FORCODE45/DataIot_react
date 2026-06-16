export interface PageMargins {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export interface ComponentStyle {
  [key: string]: string | number | undefined;
}

export interface ComponentPosition {
  relative?: boolean;
  align?: string;
  layout?: string;
  marginTop?: string;
}

export interface ChartDataPoint {
  x: string;
  y: number;
}

export interface ChartSeries {
  name: string;
  color: string;
  fill?: string;
  data: ChartDataPoint[];
}

export interface ReportComponent {
  id: string;
  type: "container" | "title" | "subtitle" | "text" | "table" | "chart" | "image";
  x?: string;
  y?: string;
  width: string;
  height?: string;
  style: ComponentStyle;
  position?: ComponentPosition;
  columns?: string[];
  tableLayout?: "pairs" | "normal";
  pairsPerRow?: number;
  children: (ReportComponent | string)[];
  chartType?: "line" | "bar" | "area";
  series?: ChartSeries[];
  aspectRatio?: string;
}

export interface PageConfig {
  width: string;
  height: string;
  orientation?: "portrait" | "landscape";
  margins: PageMargins;
  components?: ReportComponent[];
}

export interface ReportDocument {
  page?: PageConfig;
  pages?: PageConfig[];
  components?: ReportComponent[];
}

export interface GenerateReportRequest {
  document: ReportDocument;
}

export interface ReportErrorResponse {
  error: string;
  msg?: string;
}
