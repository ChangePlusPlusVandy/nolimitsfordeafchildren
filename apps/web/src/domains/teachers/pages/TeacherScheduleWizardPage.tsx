import { useMutation } from "@tanstack/react-query"
import { useTeacherHttpService } from "../services/TeacherHttpService"

export default function TeacherScheduleWizardPage() {
  const teacherHttpService = useTeacherHttpService()

  const { mutate: _mutate } = useMutation({
    mutationKey: [teacherHttpService.key, 'createSchedule'],
    mutationFn: teacherHttpService.mutations.createSchedule,
  })

  return (
    <div>
      <h1>New Teacher Schedule</h1>
    </div>
  )
}


