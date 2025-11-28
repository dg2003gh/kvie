export interface Node {
  metadata: { name: string };
  status: {
    capacity: {
      cpu: number;
      memory: string;
      pods: number;
      "ephemeral-storage": string;
    };
    conditions: { type: string; status: string }[];
  };
}

export interface ContainerStatus {
  name: string;
  ready: boolean;
  restartCount: number;
  state: {
    running?: { startedAt: string };
    waiting?: { reason: string; message?: string };
    terminated?: { exitCode: number; reason: string; finishedAt: string };
  };
}

export interface PodCondition {
  type: string; // Ready, Initialized, PodScheduled...
  status: string; // True, False, Unknown
  reason?: string;
  message?: string;
}

export interface Pod {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    creationTimestamp: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };

  spec: {
    nodeName?: string;
    qosClass?: string;
    containers: Array<Container>;
  };

  status: {
    phase: string;
    podIP?: string;
    hostIP?: string;
    containerStatuses?: Array<ContainerStatus>;
    conditions?: Array<PodCondition>;
  };
}

export interface Container {
  name: string;
  image: string;
  resources?: {
    requests?: {
      cpu?: string;
      memory?: string;
    };
    limits?: {
      cpu?: string;
      memory?: string;
    };
  };
}

export interface Namespace {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
  };
  status: { phase: string };
}

export interface Secret {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
  };
  status: { phase: string };
}

export interface Configmap {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
  };
  status: { phase: string };
}
