import { useQuery } from "@tanstack/react-query"
import { useUserHttpService } from "../services/UserHttpService"

export default function ManageUsersPage() {
  const userHttpService = useUserHttpService()

  const { data, isLoading, error } = useQuery({
    queryKey: [userHttpService.key, 'index'],
    queryFn: userHttpService.queries.index,
  })

  if (isLoading) return <div>Loading users...</div>
  if (error) return <div>Failed to load users</div>

  return (
    <div>
      <h1>Manage Users</h1>
      <ul>
        {(data ?? []).map((user: any) => (
          <li key={user.id}>{user.name ?? user.email ?? user.id}</li>
        ))}
      </ul>
    </div>
  )
}


