"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { TimeSeriesPoint } from "@/lib/types";

export function QualitySparkline({ data }: { data: TimeSeriesPoint[] }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const svg = d3.select(ref.current);
    const width = 320;
    const height = 88;
    const margin = { top: 8, right: 8, bottom: 8, left: 8 };
    const x = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([margin.left, width - margin.right]);
    const y = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.value)! - 4, d3.max(data, (d) => d.value)! + 4])
      .range([height - margin.bottom, margin.top]);
    const line = d3
      .line<TimeSeriesPoint>()
      .x((_, index) => x(index))
      .y((point) => y(point.value))
      .curve(d3.curveCatmullRom.alpha(0.5));

    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#0284c7")
      .attr("stroke-width", 3)
      .attr("d", line);
    svg
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (_, index) => x(index))
      .attr("cy", (point) => y(point.value))
      .attr("r", 3.5)
      .attr("fill", "#0284c7");
  }, [data]);

  return <svg ref={ref} className="h-24 w-full" />;
}
