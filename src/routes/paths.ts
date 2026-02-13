export const paths = {
  home: "/",
  login: "/login",
  register: "/register",
  menu: "/menu",
  machines: "/machines",
  users: "/users",
  projects: "/projects",
  projectDetail: (id: string) => `/projects/${id}`,
  projectAssets: (id: string) => `/projects/${id}/assets`,
  projectAssetDetail: (projectId: string, assetId: string) => `/projects/${projectId}/assets/${assetId}`,
  projectStages: (id: string) => `/projects/${id}/stages`,
  projectStageChecklist: (projectId: string, stageId: string) => (execId?: string) =>
    execId
      ? `/projects/${projectId}/stages/${stageId}/checklist/${execId}`
      : `/projects/${projectId}/stages/${stageId}/checklist`,
  adminChecklistTemplates: "/admin/checklist-templates",
  acceptInvite: "/accept-invite",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  codeVerification: "/code-verification",
};
