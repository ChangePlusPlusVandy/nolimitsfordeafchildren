import { useMutation } from "@tanstack/react-query"
import { useUserHttpService } from "../services/UserHttpService"

export default function MyProfilePage() {
  const userHttpService = useUserHttpService()

  const { mutate } = useMutation({
    mutationKey: [userHttpService.key, 'myProfile'],
    mutationFn: userHttpService.mutations.myProfile,
    onSuccess: (data) => {
      console.log(data)
    },
    onError: (error) => {
      console.error(error)
    }
  })

  return (
    <div>
      <h1>My Profile</h1>
    </div>
  )
}


