// UML Type Definitions
export type UMLElementType =
  | 'class'
  | 'interface'
  | 'abstract'
  | 'enum'
  | 'annotation'
  | 'usecase'
  | 'actor'
  | 'package'
  | 'component'
  | 'deployment'
  | 'activity'
  | 'state'
  | 'initial'
  | 'final'
  | 'decision'
  | 'merge'
  | 'fork'
  | 'join'
  | 'lifeline'
  | 'activation'
  | 'node'
  | 'artifact'
  | 'note'
  | 'boundary'
  | 'control'
  | 'entity';
export type ConnectorStyle =
  | 'association'
  | 'directed'
  | 'bidirectional'
  | 'inheritance'
  | 'implementation'
  | 'dependency'
  | 'aggregation'
  | 'composition'
  | 'realization';

export interface Point {
  x: number;
  y: number;
}

export interface UMLElement {
  id: string;
  type: UMLElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  attributes: string[];
  methods: string[];
  visible: boolean;
  template?: string;
  metadata?: Record<string, any>;
}

export interface UMLConnector {
  id: string;
  fromId: string;
  toId: string;
  style: ConnectorStyle;
  label: string;
  color: string;
  width: number;
  visible: boolean;
}

export interface DiagramSettings {
  showGrid: boolean;
  gridSize: number;
  gridColor: string;
  zoomLevel: number;
  minZoom: number;
  maxZoom: number;
  snapToGrid: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface UMLTemplate {
  id: string;
  name: string;
  description: string;
  elements: Omit<UMLElement, 'id'>[];
  connectors: Omit<UMLConnector, 'id'>[];
  category: string;
}

export interface CodeGenerationOptions {
  language: 'java' | 'typescript' | 'python' | 'csharp';
  includeComments: boolean;
  includeGettersSetters: boolean;
  includeConstructors: boolean;
  indentation: string;
}

export interface UMLValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  check: (elements: UMLElement[], connectors: UMLConnector[]) => UMLValidationIssue[];
}

export interface UMLValidationIssue {
  ruleId: string;
  elementId?: string;
  connectorId?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface UMLMetrics {
  totalElements: number;
  totalConnectors: number;
  elementTypeDistribution: Record<string, number>;
  connectorTypeDistribution: Record<string, number>;
  complexity: number;
  cohesion: number;
  coupling: number;
  averageConnectionsPerElement: number;
  orphanElements: number;
  depthOfInheritance: number;
}

export interface UMLOperation {
  name: string;
  visibility: '+' | '-' | '#' | '~';
  parameters: string[];
  returnType: string;
  isStatic: boolean;
  isAbstract: boolean;
}

export interface UMLAttribute {
  name: string;
  visibility: '+' | '-' | '#' | '~';
  type: string;
  isStatic: boolean;
  defaultValue?: string;
}
