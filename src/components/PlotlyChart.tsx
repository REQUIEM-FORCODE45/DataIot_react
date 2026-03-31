import { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist";
import type { Data, Layout, Config } from "plotly.js";

interface PlotlyChartProps {
  data: Data[];
  layout: Partial<Layout>;
  config?: Partial<Config>;
  style?: React.CSSProperties;
}

export default function PlotlyChartComponent({ data, layout, config, style }: PlotlyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    Plotly.react(containerRef.current, data, layout, config);
  }, [data, layout, config]);

  return <div ref={containerRef} style={style} />;
}
