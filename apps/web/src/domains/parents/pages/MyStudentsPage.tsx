import { useMutation } from "@tanstack/react-query"
import { useParentHttpService } from "../services/ParentHttpService"

export default function MyStudentsPage() {
  const parentHttpService = useParentHttpService()

  const { mutate } = useMutation({
    mutationKey: [parentHttpService.key, 'myStudents'],
    mutationFn: parentHttpService.mutations.myStudents,
    onSuccess: (data) => {
      console.log(data)
    },
    onError: (error) => {
      console.error(error)
    }
  })

  return (
    <div>
      <h1>My Students</h1>
    </div>
  )
}


