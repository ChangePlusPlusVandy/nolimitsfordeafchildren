import { listUsers } from "@/server/users/queries";

import UsersClient from "./UsersClient";

export default async function ManageUsersPage() {
  const initialData = await listUsers({ page: 1, limit: 20 });

  return <UsersClient initialData={initialData} />;
}
