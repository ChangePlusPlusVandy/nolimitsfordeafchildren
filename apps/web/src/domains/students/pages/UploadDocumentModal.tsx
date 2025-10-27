import { useMutation } from "@tanstack/react-query"
import { useStudentHttpService } from "../services/StudentHttpService"

export default function UploadDocumentModal() {
  const studentHttpService = useStudentHttpService()

  const { mutate } = useMutation({
    mutationKey: [studentHttpService.key, 'uploadDocument'],
    mutationFn: studentHttpService.mutations.uploadDocument,
  })

  return (
    <div>
      <h1>Upload Document</h1>
    </div>
  )
}


