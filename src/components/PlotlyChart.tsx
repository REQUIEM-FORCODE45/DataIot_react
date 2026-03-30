import Plotly from "react-plotly.js";
import type { Data, Layout, Config } from "plotly.js";

interface PlotlyChartProps {
  data: Data[];
  layout: Partial<Layout>;
  config?: Partial<Config>;
  style?: React.CSSProperties;
}

export default function PlotlyChart({ data, layout, config, style }: PlotlyChartProps) {
  return (
    <Plotly
      data={data}
      layout={layout}
      config={config}
      style={style}
    />
  );
}
