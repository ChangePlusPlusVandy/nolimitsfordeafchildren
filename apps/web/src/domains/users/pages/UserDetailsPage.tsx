import { useMutation } from "@tanstack/react-query"
import { useUserHttpService } from "../services/UserHttpService"

export interface UserDetailsPageProps { }

export default function UserDetailsPage(props: UserDetailsPageProps) {
  const userHttpService = useUserHttpService()

  const {
    mutate
  } = useMutation({
    mutationKey: [userHttpService.key, 'show'],
    mutationFn: userHttpService.mutations.show,
    onSuccess: (data) => {
      console.log(data)
    },
    onError: (error) => {
      console.error(error)
    }
  })

  return (
    <div>
      <h1>User Details</h1>
    </div>
  )
}