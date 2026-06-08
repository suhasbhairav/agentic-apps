"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function KnowledgeGraph({ nodes, onNodeClick }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!nodes || nodes.length === 0 || !svgRef.current) return;

    // Process nodes into graph data
    const graphNodes = [];
    const graphLinks = [];

    // Add document nodes
    nodes.forEach((doc) => {
      graphNodes.push({
        id: doc.id,
        name: doc.name,
        type: "document",
        group: 1,
      });

      // Add entity nodes and links
      const entities = doc.entities || { people: [], tools: [], processes: [] };
      
      const addEntity = (name, type, group) => {
        if (!name) return;
        const entityId = `${type}:${name}`;
        if (!graphNodes.find(n => n.id === entityId)) {
          graphNodes.push({ id: entityId, name, type, group });
        }
        graphLinks.push({ source: doc.id, target: entityId });
      };

      entities.people.forEach(p => addEntity(p, "person", 2));
      entities.tools.forEach(t => addEntity(t, "tool", 3));
      entities.processes.forEach(proc => addEntity(proc, "process", 4));
    });

    // Setup D3
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom setup
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation(graphNodes)
      .force("link", d3.forceLink(graphLinks).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    // Links
    const link = g.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(graphLinks)
      .join("line")
      .attr("stroke-width", 1);

    // Nodes
    const node = g.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(graphNodes)
      .join("g")
      .call(drag(simulation))
      .on("click", (event, d) => onNodeClick && onNodeClick(d));

    // Node circles
    node.append("circle")
      .attr("r", d => d.type === "document" ? 12 : 8)
      .attr("fill", d => {
        if (d.type === "document") return "#4f46e5"; // Indigo
        if (d.type === "person") return "#10b981";   // Emerald
        if (d.type === "tool") return "#f59e0b";     // Amber
        return "#6366f1"; // Violet for process
      });

    // Labels
    node.append("text")
      .attr("x", 12)
      .attr("y", 4)
      .text(d => d.name)
      .attr("font-size", "10px")
      .attr("fill", "#666")
      .attr("stroke", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => simulation.stop();
  }, [nodes]);

  return <svg ref={svgRef} className="w-full h-full cursor-move" />;
}
