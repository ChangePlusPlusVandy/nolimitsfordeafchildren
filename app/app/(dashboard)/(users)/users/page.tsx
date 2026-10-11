import { listUsers } from "../_list/queries";
import UsersClient from "../_list/UsersClient";

export default async function ManageUsersPage() {
  const initialData = await listUsers({ page: 1, limit: 20 });

  return <UsersClient initialData={initialData} />;
}
