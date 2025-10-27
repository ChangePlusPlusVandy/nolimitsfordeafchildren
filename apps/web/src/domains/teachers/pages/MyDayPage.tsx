import { useMutation } from "@tanstack/react-query"
import { useTeacherHttpService } from "../services/TeacherHttpService"

export default function MyDayPage() {
  const teacherHttpService = useTeacherHttpService()

  const { mutate } = useMutation({
    mutationKey: [teacherHttpService.key, 'myDay'],
    mutationFn: teacherHttpService.mutations.myDay,
    onSuccess: (data) => {
      console.log(data)
    },
    onError: (error) => {
      console.error(error)
    }
  })

  return (
    <div>
      <h1>My Day</h1>
    </div>
  )
}


