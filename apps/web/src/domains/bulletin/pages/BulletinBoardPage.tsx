import { useMutation } from "@tanstack/react-query"
import { useBulletinHttpService } from "../services/BulletinHttpService"

export default function BulletinBoardPage() {
  const bulletinHttpService = useBulletinHttpService()

  const { mutate } = useMutation({
    mutationKey: [bulletinHttpService.key, 'index'],
    mutationFn: bulletinHttpService.mutations.index,
    onSuccess: (data) => {
      console.log(data)
    },
    onError: (error) => {
      console.error(error)
    }
  })

  return (
    <div>
      <h1>Bulletin Board</h1>
    </div>
  )
}


