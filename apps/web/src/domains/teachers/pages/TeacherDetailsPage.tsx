import { useMutation } from "@tanstack/react-query"
import { useTeacherHttpService } from "../services/TeacherHttpService"

export default function TeacherDetailsPage() {
  const teacherHttpService = useTeacherHttpService()

  const { mutate } = useMutation({
    mutationKey: [teacherHttpService.key, 'show'],
    mutationFn: teacherHttpService.mutations.show,
    onSuccess: (data) => {
      console.log(data)
    },
    onError: (error) => {
      console.error(error)
    }
  })

  return (
    <div>
      <h1>Teacher Details</h1>
    </div>
  )
}


