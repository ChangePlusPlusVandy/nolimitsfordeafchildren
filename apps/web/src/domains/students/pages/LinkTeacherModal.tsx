import { useMutation } from "@tanstack/react-query"
import { useStudentHttpService } from "../services/StudentHttpService"

export default function LinkTeacherModal() {
  const studentHttpService = useStudentHttpService()

  const { mutate } = useMutation({
    mutationKey: [studentHttpService.key, 'linkTeacher'],
    mutationFn: studentHttpService.mutations.linkTeacher,
  })

  return (
    <div>
      <h1>Link Teacher</h1>
    </div>
  )
}


