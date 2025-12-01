import { useMutation } from "@tanstack/react-query"
import { useStudentHttpService } from "../services/StudentHttpService"

export default function StudentDetailsPage() {
  const studentHttpService = useStudentHttpService()

  const { mutate: _mutate } = useMutation({
    mutationKey: [studentHttpService.key, 'show'],
    mutationFn: studentHttpService.mutations.show,
    onSuccess: (data) => {
      console.log(data)
    },
    onError: (error) => {
      console.error(error)
    }
  })

  return (
    <div>
      <h1>Student Details</h1>
    </div>
  )
}


