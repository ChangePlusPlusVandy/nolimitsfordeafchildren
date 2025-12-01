import { useMutation } from "@tanstack/react-query"
import { useTeacherHttpService } from "../services/TeacherHttpService"

export default function NewTeacherPage() {
  const teacherHttpService = useTeacherHttpService()

  const { mutate: _mutate } = useMutation({
    mutationKey: [teacherHttpService.key, 'create'],
    mutationFn: teacherHttpService.mutations.create,
  })

  return (
    <div>
      <h1>New Teacher</h1>
    </div>
  )
}


