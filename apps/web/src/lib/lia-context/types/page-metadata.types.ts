export interface ComponentInfo {
  commonErrors?: string[];
  description: string;
  name: string;
  path: string;
  props?: string[];
}

export interface ApiInfo {
  commonErrors?: string[];
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

export interface UserFlow {
  commonBreakpoints?: string[];
  name: string;
  steps: string[];
}

export interface CommonIssue {
  description: string;
  possibleCauses: string[];
  solutions: string[];
}

export interface PageMetadata {
  apis: ApiInfo[];
  commonIssues: CommonIssue[];
  components: ComponentInfo[];
  pageType: string;
  route: string;
  routePattern: string;
  userFlows: UserFlow[];
}
