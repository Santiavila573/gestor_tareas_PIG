// Enhanced UML Utilities and Helpers
import { 
  UMLElement, 
  UMLConnector, 
  UMLElementType, 
  ConnectorStyle, 
  UMLValidationRule,
  UMLValidationIssue,
  CodeGenerationOptions,
  UMLTemplate,
  UMLOperation,
  UMLAttribute,
  UMLMetrics
} from './UMLTypes';

// UML Validation Rules Implementation
export const UMLValidationRules: UMLValidationRule[] = [
  {
    id: 'class-name-empty',
    name: 'Clase sin nombre',
    description: 'Las clases deben tener un nombre',
    severity: 'error',
    check: (elements, connectors) => {
      return elements
        .filter(el => el.type === 'class' && (!el.text || el.text.trim() === ''))
        .map(el => ({
          ruleId: 'class-name-empty',
          elementId: el.id,
          message: 'La clase no tiene nombre',
          severity: 'error' as const,
          suggestion: 'Asigne un nombre descriptivo a la clase',
        }));
    },
  },
  {
    id: 'circular-inheritance',
    name: 'Herencia circular',
    description: 'Evitar herencia circular entre clases',
    severity: 'error',
    check: (elements, connectors) => {
      const issues: UMLValidationIssue[] = [];
      const inheritanceConnectors = connectors.filter(c => c.style === 'inheritance');
      
      // Simple circular inheritance detection
      const inheritanceMap = new Map<string, string[]>();
      inheritanceConnectors.forEach(conn => {
        if (!inheritanceMap.has(conn.toId)) {
          inheritanceMap.set(conn.toId, []);
        }
        inheritanceMap.get(conn.toId)!.push(conn.fromId);
      });
      
      // Check for cycles (simplified)
      elements.forEach(element => {
        const visited = new Set<string>();
        const checkCycle = (currentId: string, path: string[] = []): boolean => {
          if (visited.has(currentId)) return false;
          visited.add(currentId);
          
          const children = inheritanceMap.get(currentId) || [];
          for (const childId of children) {
            if (path.includes(childId)) {
              return true; // Cycle detected
            }
            if (checkCycle(childId, [...path, currentId])) {
              return true;
            }
          }
          return false;
        };
        
        if (checkCycle(element.id)) {
          issues.push({
            ruleId: 'circular-inheritance',
            elementId: element.id,
            message: 'Herencia circular detectada',
            severity: 'error',
            suggestion: 'Revisar la jerarquía de herencia',
          });
        }
      });
      
      return issues;
    },
  },
  {
    id: 'orphan-elements',
    name: 'Elementos huérfanos',
    description: 'Elementos sin conexiones',
    severity: 'warning',
    check: (elements, connectors) => {
      const connectedElementIds = new Set<string>();
      connectors.forEach(conn => {
        connectedElementIds.add(conn.fromId);
        connectedElementIds.add(conn.toId);
      });
      
      return elements
        .filter(el => !connectedElementIds.has(el.id))
        .map(el => ({
          ruleId: 'orphan-elements',
          elementId: el.id,
          message: 'Elemento sin conexiones',
          severity: 'warning' as const,
          suggestion: 'Considere conectar este elemento con otros',
        }));
    },
  },
  {
    id: 'interface-implementation',
    name: 'Implementación de interfaz',
    description: 'Verificar que las clases implementen correctamente las interfaces',
    severity: 'error',
    check: (elements, connectors) => {
      const issues: UMLValidationIssue[] = [];
      const implementationConnectors = connectors.filter(c => c.style === 'realization');
      
      implementationConnectors.forEach(conn => {
        const fromElement = elements.find(el => el.id === conn.fromId);
        const toElement = elements.find(el => el.id === conn.toId);
        
        if (fromElement && toElement) {
          if (fromElement.type !== 'class') {
            issues.push({
              ruleId: 'interface-implementation',
              connectorId: conn.id,
              message: 'Solo las clases pueden implementar interfaces',
              severity: 'error',
              suggestion: 'El origen debe ser una clase',
            });
          }
          
          if (toElement.type !== 'interface') {
            issues.push({
              ruleId: 'interface-implementation',
              connectorId: conn.id,
              message: 'El destino debe ser una interfaz',
              severity: 'error',
              suggestion: 'El destino debe ser una interfaz',
            });
          }
        }
      });
      
      return issues;
    },
  },
];

export class UMLValidator {
  static validateDiagram(elements: UMLElement[], connectors: UMLConnector[]): UMLValidationIssue[] {
    return UMLValidationRules.flatMap(rule => rule.check(elements, connectors));
  }

  static fixIssue(
    issue: UMLValidationIssue,
    elements: UMLElement[],
    connectors: UMLConnector[]
  ): { success: boolean; elements: UMLElement[]; connectors: UMLConnector[] } {
    if (issue.ruleId === 'class-name-empty' && issue.elementId) {
      const updatedElements = elements.map(el => {
        if (el.id !== issue.elementId) return el;
        const fallbackName = `Clase${Math.floor(Math.random() * 1000)}`;
        return { ...el, text: el.text && el.text.trim() !== '' ? el.text : fallbackName };
      });
      return { success: true, elements: updatedElements, connectors };
    }

    return { success: false, elements, connectors };
  }
}

// UML Layout Algorithms
export interface LayoutOptions {
  algorithm: 'hierarchical' | 'force-directed' | 'circular' | 'grid';
  spacing: number;
  direction?: 'TB' | 'BT' | 'LR' | 'RL'; // Top-Bottom, Bottom-Top, Left-Right, Right-Left
}

export class UMLLayoutEngine {
  static hierarchicalLayout(elements: UMLElement[], connectors: UMLConnector[], options: LayoutOptions): UMLElement[] {
    const { spacing, direction = 'TB' } = options;
    const inheritanceConnectors = connectors.filter(c => c.style === 'inheritance' || c.style === 'realization');
    
    // Build hierarchy
    const hierarchy = new Map<string, string[]>();
    const levels = new Map<string, number>();
    const processed = new Set<string>();
    
    // Initialize hierarchy
    elements.forEach(el => {
      hierarchy.set(el.id, []);
      levels.set(el.id, 0);
    });
    
    // Build parent-child relationships
    inheritanceConnectors.forEach(conn => {
      const children = hierarchy.get(conn.toId) || [];
      children.push(conn.fromId);
      hierarchy.set(conn.toId, children);
    });
    
    // Calculate levels using BFS
    const queue: string[] = [];
    elements.forEach(el => {
      if (!inheritanceConnectors.some(conn => conn.fromId === el.id)) {
        queue.push(el.id);
        levels.set(el.id, 0);
      }
    });
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (processed.has(currentId)) continue;
      processed.add(currentId);
      
      const currentLevel = levels.get(currentId) || 0;
      const children = hierarchy.get(currentId) || [];
      
      children.forEach(childId => {
        const childLevel = levels.get(childId) || 0;
        if (currentLevel + 1 > childLevel) {
          levels.set(childId, currentLevel + 1);
          queue.push(childId);
        }
      });
    }
    
    // Group elements by level
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, elementId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(elementId);
    });
    
    // Position elements
    const updatedElements: UMLElement[] = elements.map(el => {
      const level = levels.get(el.id) || 0;
      const levelElements = levelGroups.get(level) || [];
      const indexInLevel = levelElements.indexOf(el.id);
      
      let x = 0, y = 0;
      
      switch (direction) {
        case 'TB':
          x = indexInLevel * (el.width + spacing);
          y = level * (el.height + spacing);
          break;
        case 'BT':
          x = indexInLevel * (el.width + spacing);
          y = (Math.max(...Array.from(levels.values())) - level) * (el.height + spacing);
          break;
        case 'LR':
          x = level * (el.width + spacing);
          y = indexInLevel * (el.height + spacing);
          break;
        case 'RL':
          x = (Math.max(...Array.from(levels.values())) - level) * (el.width + spacing);
          y = indexInLevel * (el.height + spacing);
          break;
      }
      
      return { ...el, x, y };
    });
    
    return updatedElements;
  }
  
  static forceDirectedLayout(elements: UMLElement[], connectors: UMLConnector[], options: LayoutOptions): UMLElement[] {
    const { spacing } = options;
    const iterations = 100;
    const repulsionStrength = spacing * spacing;
    const attractionStrength = 0.1;
    const damping = 0.9;
    
    // Initialize positions randomly if not set
    const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
    elements.forEach((el, index) => {
      positions.set(el.id, {
        x: el.x || (index % 5) * spacing,
        y: el.y || Math.floor(index / 5) * spacing,
        vx: 0,
        vy: 0,
      });
    });
    
    // Run simulation
    for (let i = 0; i < iterations; i++) {
      // Calculate repulsion forces
      elements.forEach(el1 => {
        const pos1 = positions.get(el1.id)!;
        let fx = 0, fy = 0;
        
        elements.forEach(el2 => {
          if (el1.id === el2.id) return;
          
          const pos2 = positions.get(el2.id)!;
          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsionStrength / (distance * distance);
          
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        });
        
        // Calculate attraction forces from connectors
        connectors.forEach(conn => {
          if (conn.fromId === el1.id) {
            const pos2 = positions.get(conn.toId)!;
            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = distance * attractionStrength;
            
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          } else if (conn.toId === el1.id) {
            const pos2 = positions.get(conn.fromId)!;
            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = distance * attractionStrength;
            
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          }
        });
        
        // Update velocity and position
        pos1.vx = (pos1.vx + fx) * damping;
        pos1.vy = (pos1.vy + fy) * damping;
        pos1.x += pos1.vx;
        pos1.y += pos1.vy;
      });
    }
    
    // Return updated elements
    return elements.map(el => {
      const pos = positions.get(el.id)!;
      return { ...el, x: pos.x, y: pos.y };
    });
  }

  static circularLayout(elements: UMLElement[], options: LayoutOptions): UMLElement[] {
    const { spacing } = options;
    const count = elements.length || 1;
    const radius = Math.max(spacing * 2, (count * spacing) / (2 * Math.PI));
    return elements.map((el, index) => {
      const angle = (2 * Math.PI * index) / count;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return { ...el, x, y };
    });
  }

  static autoLayout(
    elements: UMLElement[],
    connectors: UMLConnector[],
    algorithm: 'hierarchical' | 'force-directed' | 'circular' = 'hierarchical',
    spacing = 120
  ): { elements: UMLElement[]; connectors: UMLConnector[] } {
    const options: LayoutOptions = { algorithm, spacing, direction: 'TB' };
    let updatedElements = elements;
    if (algorithm === 'force-directed') {
      updatedElements = this.forceDirectedLayout(elements, connectors, options);
    } else if (algorithm === 'circular') {
      updatedElements = this.circularLayout(elements, options);
    } else {
      updatedElements = this.hierarchicalLayout(elements, connectors, options);
    }
    return { elements: updatedElements, connectors };
  }

  static optimizeLayout(
    elements: UMLElement[],
    connectors: UMLConnector[],
    spacing = 140
  ): { elements: UMLElement[]; connectors: UMLConnector[] } {
    return this.autoLayout(elements, connectors, 'force-directed', spacing);
  }
}

export class UMLCodeGenerator {
  static generateCode(elements: UMLElement[], options: CodeGenerationOptions): string {
    const { language, includeComments, includeGettersSetters, includeConstructors, indentation } = options;
    
    const classElements = elements.filter(el => el.type === 'class' || el.type === 'interface' || el.type === 'abstract');
    
    switch (language) {
      case 'java':
        return this.generateJavaCode(classElements, { includeComments, includeGettersSetters, includeConstructors, indentation });
      case 'typescript':
        return this.generateTypeScriptCode(classElements, { includeComments, includeGettersSetters, includeConstructors, indentation });
      case 'python':
        return this.generatePythonCode(classElements, { includeComments, includeGettersSetters, includeConstructors, indentation });
      case 'csharp':
        return this.generateCSharpCode(classElements, { includeComments, includeGettersSetters, includeConstructors, indentation });
      default:
        return '';
    }
  }
  
  private static generateJavaCode(elements: UMLElement[], options: any): string {
    const { includeComments, includeGettersSetters, includeConstructors, indentation } = options;
    let code = '';
    
    elements.forEach(element => {
      if (includeComments) {
        code += `/**\n * ${element.text}\n */\n`;
      }
      
      const classType = element.type === 'interface' ? 'interface' : element.type === 'abstract' ? 'abstract class' : 'class';
      code += `public ${classType} ${element.text} {\n`;
      
      // Attributes
      element.attributes.forEach(attr => {
        const access = attr.startsWith('+') ? 'public' : attr.startsWith('-') ? 'private' : 'protected';
        const attrDef = attr.substring(1).trim();
        code += `${indentation}${access} ${attrDef};\n`;
      });
      
      if (element.attributes.length > 0) code += '\n';
      
      // Constructor
      if (includeConstructors && element.type !== 'interface') {
        code += `${indentation}public ${element.text}() {\n${indentation}}\n\n`;
      }
      
      // Methods
      element.methods.forEach(method => {
        const access = method.startsWith('+') ? 'public' : method.startsWith('-') ? 'private' : 'protected';
        const methodDef = method.substring(1).trim();
        const isAbstract = element.type === 'interface' || element.type === 'abstract';
        
        if (isAbstract && !methodDef.includes('{')) {
          code += `${indentation}${access} abstract ${methodDef};\n`;
        } else {
          code += `${indentation}${access} ${methodDef} {\n${indentation}${indentation}// TODO: Implement\n${indentation}}\n`;
        }
      });
      
      code += '}\n\n';
    });
    
    return code;
  }
  
  private static generateTypeScriptCode(elements: UMLElement[], options: any): string {
    const { includeComments, includeGettersSetters, includeConstructors, indentation } = options;
    let code = '';
    
    elements.forEach(element => {
      if (includeComments) {
        code += `/**\n * ${element.text}\n */\n`;
      }
      
      if (element.type === 'interface') {
        code += `interface ${element.text} {\n`;
        
        // Interface properties
        element.attributes.forEach(attr => {
          const attrDef = attr.substring(1).trim();
          code += `${indentation}${attrDef};\n`;
        });
        
        if (element.attributes.length > 0 && element.methods.length > 0) code += '\n';
        
        // Interface methods
        element.methods.forEach(method => {
          const methodDef = method.substring(1).trim();
          code += `${indentation}${methodDef};\n`;
        });
        
        code += '}\n\n';
      } else {
        code += `class ${element.text} {\n`;
        
        // Attributes
        element.attributes.forEach(attr => {
          const access = attr.startsWith('+') ? 'public' : attr.startsWith('-') ? 'private' : 'protected';
          const attrDef = attr.substring(1).trim();
          code += `${indentation}${access} ${attrDef};\n`;
        });
        
        if (element.attributes.length > 0) code += '\n';
        
        // Constructor
        if (includeConstructors) {
          code += `${indentation}constructor() {\n${indentation}}\n\n`;
        }
        
        // Methods
        element.methods.forEach(method => {
          const access = method.startsWith('+') ? 'public' : method.startsWith('-') ? 'private' : 'protected';
          const methodDef = method.substring(1).trim();
          code += `${indentation}${access} ${methodDef} {\n${indentation}${indentation}// TODO: Implement\n${indentation}}\n`;
        });
        
        code += '}\n\n';
      }
    });
    
    return code;
  }
  
  private static generatePythonCode(elements: UMLElement[], options: any): string {
    const { includeComments, includeGettersSetters, includeConstructors, indentation } = options;
    let code = '';
    
    elements.forEach(element => {
      if (includeComments) {
        code += `# ${element.text}\n`;
      }
      
      code += `class ${element.text}:`;
      
      if (element.type === 'interface') {
        code += `  # Interface (Python no tiene interfaces nativas)\n`;
      }
      
      code += '\n';
      
      // Constructor
      if (includeConstructors) {
        code += `${indentation}def __init__(self):\n`;
        
        // Initialize attributes
        element.attributes.forEach(attr => {
          const attrName = attr.split(':')[0].replace(/[+-]/, '').trim();
          code += `${indentation}${indentation}self.${attrName} = None\n`;
        });
        
        code += '\n';
      }
      
      // Methods
      element.methods.forEach(method => {
        const methodName = method.split('(')[0].replace(/[+-]/, '').trim();
        const params = method.match(/\((.*?)\)/)?.[1] || '';
        code += `${indentation}def ${methodName}(self${params ? ', ' + params : ''}):\n`;
        code += `${indentation}${indentation}# TODO: Implement\n${indentation}${indentation}pass\n\n`;
      });
      
      code += '\n';
    });
    
    return code;
  }
  
  private static generateCSharpCode(elements: UMLElement[], options: any): string {
    const { includeComments, includeGettersSetters, includeConstructors, indentation } = options;
    let code = '';
    
    elements.forEach(element => {
      if (includeComments) {
        code += `/// <summary>\n/// ${element.text}\n/// </summary>\n`;
      }
      
      const classType = element.type === 'interface' ? 'interface' : element.type === 'abstract' ? 'abstract class' : 'class';
      const accessModifier = element.type === 'interface' ? 'public' : 'public';
      code += `${accessModifier} ${classType} ${element.text}\n{\n`;
      
      // Attributes
      element.attributes.forEach(attr => {
        const access = attr.startsWith('+') ? 'public' : attr.startsWith('-') ? 'private' : 'protected';
        const attrDef = attr.substring(1).trim();
        code += `${indentation}${access} ${attrDef};\n`;
      });
      
      if (element.attributes.length > 0) code += '\n';
      
      // Constructor
      if (includeConstructors && element.type !== 'interface') {
        code += `${indentation}public ${element.text}()\n${indentation}{\n${indentation}}\n\n`;
      }
      
      // Methods
      element.methods.forEach(method => {
        const access = method.startsWith('+') ? 'public' : method.startsWith('-') ? 'private' : 'protected';
        const methodDef = method.substring(1).trim();
        const isAbstract = element.type === 'interface' || element.type === 'abstract';
        
        if (isAbstract && !methodDef.includes("{")) {
          code += `${indentation}${access} abstract ${methodDef};\n`;
        } else {
          code += `${indentation}${access} ${methodDef}\n${indentation}{\n${indentation}${indentation}// TODO: Implement\n${indentation}}\n`;
        }
      });
      
      code += '}\n\n';
    });
    
    return code;
  }
}

export class UMLMetricsCalculator {
  static calculateMetrics(elements: UMLElement[], connectors: UMLConnector[]): UMLMetrics {
    const elementTypeDistribution: Record<string, number> = {};
    const connectorTypeDistribution: Record<string, number> = {};
    
    // Count element types
    elements.forEach(el => {
      elementTypeDistribution[el.type] = (elementTypeDistribution[el.type] || 0) + 1;
    });
    
    // Count connector types
    connectors.forEach(conn => {
      connectorTypeDistribution[conn.style] = (connectorTypeDistribution[conn.style] || 0) + 1;
    });
    
    // Calculate complexity score
    const complexityScore = this.calculateComplexityScore(elements, connectors);
    
    // Calculate average connections per element
    const averageConnectionsPerElement = connectors.length / elements.length || 0;
    
    // Count orphan elements
    const connectedElementIds = new Set<string>();
    connectors.forEach(conn => {
      connectedElementIds.add(conn.fromId);
      connectedElementIds.add(conn.toId);
    });
    const orphanElements = elements.filter(el => !connectedElementIds.has(el.id)).length;
    
    // Calculate depth of inheritance
    const depthOfInheritance = this.calculateInheritanceDepth(elements, connectors);
    
    const complexity = complexityScore;
    const cohesion = elements.length === 0 ? 0 : Math.max(0, 1 - orphanElements / elements.length);
    const coupling = averageConnectionsPerElement;
    
    return {
      totalElements: elements.length,
      totalConnectors: connectors.length,
      elementTypeDistribution,
      connectorTypeDistribution,
      complexity,
      cohesion,
      coupling,
      averageConnectionsPerElement,
      orphanElements,
      depthOfInheritance,
    };
  }
  
  private static calculateComplexityScore(elements: UMLElement[], connectors: UMLConnector[]): number {
    let score = 0;
    
    // Base complexity
    score += elements.length * 1;
    score += connectors.length * 2;
    
    // Inheritance complexity
    const inheritanceConnectors = connectors.filter(c => c.style === 'inheritance');
    score += inheritanceConnectors.length * 3;
    
    // Interface implementation complexity
    const realizationConnectors = connectors.filter(c => c.style === 'realization');
    score += realizationConnectors.length * 2;
    
    // Association complexity
    const associationConnectors = connectors.filter(c => c.style === 'association' || c.style === 'directed');
    score += associationConnectors.length * 1.5;
    
    return Math.round(score * 100) / 100;
  }
  
  private static calculateInheritanceDepth(elements: UMLElement[], connectors: UMLConnector[]): number {
    const inheritanceConnectors = connectors.filter(c => c.style === 'inheritance');
    const maxDepths = new Map<string, number>();
    
    // Initialize all elements with depth 0
    elements.forEach(el => maxDepths.set(el.id, 0));
    
    // Calculate depths
    const calculateDepth = (elementId: string, visited = new Set<string>()): number => {
      if (visited.has(elementId)) return 0; // Avoid cycles
      visited.add(elementId);
      
      const children = inheritanceConnectors
        .filter(conn => conn.toId === elementId)
        .map(conn => conn.fromId);
      
      if (children.length === 0) return 0;
      
      const childDepths = children.map(childId => calculateDepth(childId, new Set(visited)));
      return Math.max(...childDepths) + 1;
    };
    
    elements.forEach(el => {
      const depth = calculateDepth(el.id);
      maxDepths.set(el.id, depth);
    });
    
    return Math.max(...Array.from(maxDepths.values()));
  }
}

// Export utilities
export const UMLUtils = {
  generateElementId: (type: UMLElementType): string => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  generateConnectorId: (): string => {
    return `connector-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  snapToGrid: (value: number, gridSize: number): number => {
    return Math.round(value / gridSize) * gridSize;
  },
  
  getDistance: (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  },
  
  getMidpoint: (p1: { x: number; y: number }, p2: { x: number; y: number }): { x: number; y: number } => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  },
  
  isPointInRectangle: (point: { x: number; y: number }, rect: { x: number; y: number; width: number; height: number }): boolean => {
    return point.x >= rect.x && point.x <= rect.x + rect.width &&
           point.y >= rect.y && point.y <= rect.y + rect.height;
  },
  
  getRectangleCenter: (rect: { x: number; y: number; width: number; height: number }): { x: number; y: number } => {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    };
  },
  
  normalizeAngle: (angle: number): number => {
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    return angle;
  },
  
  getAngleBetweenPoints: (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
  },
};
