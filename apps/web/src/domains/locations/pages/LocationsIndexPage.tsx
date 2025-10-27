import { useQuery } from "@tanstack/react-query"
import { useLocationHttpService } from "../services/LocationHttpService"

export default function LocationsIndexPage() {
  const locationHttpService = useLocationHttpService()

  const { data } = useQuery({
    queryKey: [locationHttpService.key, 'index'],
    queryFn: locationHttpService.queries.index,
  })

  return (
    <div>
      <h1>Locations</h1>
      <ul>
        {(data ?? []).map((site: any) => (
          <li key={site.id}>{site.name ?? site.id}</li>
        ))}
      </ul>
    </div>
  )
}


