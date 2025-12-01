import { useMutation } from "@tanstack/react-query"
import { useUserHttpService } from "../services/UserHttpService"

export default function InviteUserModal() {
  const userHttpService = useUserHttpService()

  const { mutate: _mutate } = useMutation({
    mutationKey: [userHttpService.key, 'invite'],
    mutationFn: userHttpService.mutations.invite,
  })

  return (
    <div>
      <h1>Invite User</h1>
    </div>
  )
}


