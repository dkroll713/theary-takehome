export interface Root {
  id: number;
}

export interface Node {
  id: number;
  label: string;
  parent_id: number | null;
  root_id: number;
}

type NodeId = number;
export interface NodeRow {
  id: NodeId;
}