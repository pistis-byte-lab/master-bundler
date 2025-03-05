
import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import { ModuleMetadata, Dependency } from '../types';

export interface Node {
  id: string;
  dependencies: string[];
  dependents: string[];
  size: number;
  type: 'source' | 'external' | 'dynamic';
}

export interface Graph {
  nodes: Map<string, Node>;
  getNode(id: string): Node | undefined;
  addNode(id: string, metadata: ModuleMetadata): void;
  getJSON(): any;
  getDOT(): string;
  getHTMLVisualization(): string;
}

export class DependencyGraph implements Graph {
  nodes: Map<string, Node> = new Map();
  
  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }
  
  addNode(id: string, metadata: ModuleMetadata): void {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        dependencies: [],
        dependents: [],
        size: metadata.size || 0,
        type: id.startsWith('external:') ? 'external' : 'source'
      });
    }
    
    // Update existing node with new metadata
    const node = this.nodes.get(id)!;
    node.size = metadata.size || node.size;
    
    // Process dependencies
    for (const dep of metadata.dependencies) {
      const depId = dep.path;
      
      // Skip if already registered
      if (node.dependencies.includes(depId)) {
        continue;
      }
      
      // Add dependency to current node
      node.dependencies.push(depId);
      
      // Create the dependency node if it doesn't exist
      if (!this.nodes.has(depId)) {
        this.nodes.set(depId, {
          id: depId,
          dependencies: [],
          dependents: [id],
          size: 0,
          type: dep.external ? 'external' : dep.type === 'dynamic' ? 'dynamic' : 'source'
        });
      } else {
        // Update dependent list of the dependency
        const depNode = this.nodes.get(depId)!;
        if (!depNode.dependents.includes(id)) {
          depNode.dependents.push(id);
        }
      }
    }
  }
  
  getJSON(): any {
    const result = {
      nodes: [] as any[],
      links: [] as any[]
    };
    
    // Add nodes
    this.nodes.forEach(node => {
      result.nodes.push({
        id: node.id,
        size: node.size,
        type: node.type,
        dependentsCount: node.dependents.length,
        dependenciesCount: node.dependencies.length
      });
      
      // Add links from this node to its dependencies
      node.dependencies.forEach(dep => {
        result.links.push({
          source: node.id,
          target: dep,
          value: 1
        });
      });
    });
    
    return result;
  }
  
  getDOT(): string {
    const lines = ['digraph DependencyGraph {'];
    
    // Node definitions
    this.nodes.forEach(node => {
      const color = node.type === 'external' ? 'gray' : 
                    node.type === 'dynamic' ? 'blue' : 'black';
      const shape = node.type === 'external' ? 'box' : 'ellipse';
      const label = path.basename(node.id);
      
      lines.push(`  "${node.id}" [label="${label}", shape=${shape}, color=${color}, tooltip="${node.id}", fontsize=10];`);
    });
    
    // Edge definitions
    this.nodes.forEach(node => {
      node.dependencies.forEach(dep => {
        lines.push(`  "${node.id}" -> "${dep}";`);
      });
    });
    
    lines.push('}');
    return lines.join('\n');
  }
  
  getHTMLVisualization(): string {
    const graphData = this.getJSON();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dependency Graph Visualization</title>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; }
    #graph { width: 100%; height: 100%; }
    .node text { font-size: 10px; }
    .node.external { fill: #d3d3d3; }
    .node.dynamic { fill: #add8e6; }
    .node.source { fill: #90ee90; }
  </style>
</head>
<body>
  <div id="graph"></div>
  
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script>
    // Graph data
    const data = ${JSON.stringify(graphData, null, 2)};
    
    // Create a force-directed graph
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));
    
    const svg = d3.select("#graph").append("svg")
      .attr("width", width)
      .attr("height", height);
    
    // Create a group for all elements
    const g = svg.append("g");
    
    // Add zoom behavior
    svg.call(d3.zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      }));
    
    // Draw links
    const link = g.append("g")
      .selectAll("line")
      .data(data.links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.value));
    
    // Draw nodes
    const node = g.append("g")
      .selectAll("g")
      .data(data.nodes)
      .enter().append("g")
      .attr("class", d => "node " + d.type)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    // Add circles to nodes
    node.append("circle")
      .attr("r", d => 5 + Math.sqrt(d.size / 100))
      .attr("fill", d => d.type === "external" ? "#d3d3d3" : d.type === "dynamic" ? "#add8e6" : "#90ee90")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);
    
    // Add labels to nodes
    node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(d => d.id.split('/').pop());
    
    // Add titles for tooltips
    node.append("title")
      .text(d => d.id);
    
    // Update positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
    
      node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    });
    
    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  </script>
</body>
</html>
    `;
  }
  
  saveVisualization(outputPath: string): void {
    try {
      fs.writeFileSync(outputPath, this.getHTMLVisualization(), 'utf8');
      logger.success(`Dependency graph visualization saved to ${outputPath}`);
    } catch (error) {
      logger.error(`Failed to save visualization: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  generateReport(): string {
    const lines: string[] = [];
    lines.push('# Dependency Analysis Report');
    lines.push('');
    lines.push(`Total modules: ${this.nodes.size}`);
    lines.push('');
    
    // Count by type
    const typeCounts = {
      source: 0,
      external: 0,
      dynamic: 0
    };
    
    this.nodes.forEach(node => {
      typeCounts[node.type]++;
    });
    
    lines.push('## Module Types');
    lines.push(`- Source modules: ${typeCounts.source}`);
    lines.push(`- External dependencies: ${typeCounts.external}`);
    lines.push(`- Dynamic imports: ${typeCounts.dynamic}`);
    lines.push('');
    
    // Find most depended-upon modules
    const sorted = Array.from(this.nodes.values())
      .sort((a, b) => b.dependents.length - a.dependents.length)
      .slice(0, 10);
    
    lines.push('## Most Used Modules');
    sorted.forEach((node, index) => {
      lines.push(`${index + 1}. **${node.id}** (used by ${node.dependents.length} modules)`);
    });
    lines.push('');
    
    // Find circular dependencies
    const circular = this.findCircularDependencies();
    lines.push('## Circular Dependencies');
    if (circular.length === 0) {
      lines.push('No circular dependencies found.');
    } else {
      circular.forEach((cycle, index) => {
        lines.push(`${index + 1}. ${cycle.join(' → ')} → ${cycle[0]}`);
      });
    }
    
    return lines.join('\n');
  }
  
  private findCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const path: string[] = [];
    
    const dfs = (nodeId: string) => {
      if (path.includes(nodeId)) {
        const cycle = path.slice(path.indexOf(nodeId));
        cycles.push(cycle);
        return;
      }
      
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      path.push(nodeId);
      
      const node = this.nodes.get(nodeId);
      if (node) {
        for (const dep of node.dependencies) {
          dfs(dep);
        }
      }
      
      path.pop();
    };
    
    // Start DFS from each node to find all cycles
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }
    
    return cycles;
  }
}

export function createDependencyGraph(modules: Map<string, ModuleMetadata>): DependencyGraph {
  const graph = new DependencyGraph();
  
  modules.forEach((metadata, id) => {
    graph.addNode(id, metadata);
  });
  
  return graph;
}
