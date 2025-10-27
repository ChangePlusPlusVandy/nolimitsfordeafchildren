import { useMutation } from "@tanstack/react-query"
import { useLocationHttpService } from "../services/LocationHttpService"

export default function LocationDetailsPage() {
  const locationHttpService = useLocationHttpService()

  const { mutate } = useMutation({
    mutationKey: [locationHttpService.key, 'show'],
    mutationFn: locationHttpService.mutations.show,
    onSuccess: (data) => {
      console.log(data)
    },
    onError: (error) => {
      console.error(error)
    }
  })

  return (
    <div>
      <h1>Location Details</h1>
    </div>
  )
}


