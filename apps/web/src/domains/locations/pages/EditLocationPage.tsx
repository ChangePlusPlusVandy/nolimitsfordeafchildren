import { useMutation } from "@tanstack/react-query"
import { useLocationHttpService } from "../services/LocationHttpService"

export default function EditLocationPage() {
  const locationHttpService = useLocationHttpService()

  const { mutate: _mutate } = useMutation({
    mutationKey: [locationHttpService.key, 'update'],
    mutationFn: locationHttpService.mutations.update,
  })

  return (
    <div>
      <h1>Edit Location</h1>
    </div>
  )
}


