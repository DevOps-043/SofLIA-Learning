import {
  handleCourseImportDiagnosticsRequest,
  handleCourseImportRequest,
} from './course-import'

export async function GET() {
  return handleCourseImportDiagnosticsRequest()
}

export async function POST(request: Request) {
  return handleCourseImportRequest(request)
}
