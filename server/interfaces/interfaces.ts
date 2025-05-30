export interface Root {
  id: number;
}

export interface Node {
  id: number;
  label: string;
  parent_id: number | null;
  root_id: number;
}

export interface NodeWithChildren {
  id: number;
  label: string;
  parent_id: number | null;
  root_id: number;
  children: NodeWithChildren[];
}

type NodeId = number;
export interface NodeRow {
  id: NodeId;
}