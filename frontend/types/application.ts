// types/application.ts
export interface Application {
  applicationRefNo: string;
  applicantId: string;
  status: string;
  applicationType: string;
  priority: string;
  createdDt: string;
  formData?: any;
}

export interface SearchResponse {
  content: Application[];
  totalElements: number;
  pageNo: number;
  pageSize: number;
}