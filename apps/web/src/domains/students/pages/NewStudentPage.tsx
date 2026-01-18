import { useMutation } from "@tanstack/react-query"
import { useStudentHttpService } from "../services/StudentHttpService"

export default function NewStudentPage() {
  const studentHttpService = useStudentHttpService()

  const { mutate: _mutate } = useMutation({
    mutationKey: [studentHttpService.key, 'create'],
    mutationFn: studentHttpService.mutations.create,
  })

  return (
    <div>
      <h1>New Student</h1>
    </div>
  )
}


