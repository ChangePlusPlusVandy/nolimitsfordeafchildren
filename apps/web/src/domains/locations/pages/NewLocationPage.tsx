import { useMutation } from "@tanstack/react-query"
import { useLocationHttpService } from "../services/LocationHttpService"

export default function NewLocationPage() {
  const locationHttpService = useLocationHttpService()

  const { mutate } = useMutation({
    mutationKey: [locationHttpService.key, 'create'],
    mutationFn: locationHttpService.mutations.create,
  })

  return (
    <div>
      <h1>New Location</h1>
    </div>
  )
}


