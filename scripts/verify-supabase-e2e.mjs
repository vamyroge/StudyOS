import { createClient } from "@supabase/supabase-js";

const required = [
  "TEST_SUPABASE_URL",
  "TEST_SUPABASE_ANON_KEY",
  "TEST_STUDENT_A_EMAIL",
  "TEST_STUDENT_A_PASSWORD",
  "TEST_STUDENT_B_EMAIL",
  "TEST_STUDENT_B_PASSWORD",
  "TEST_ADMIN_EMAIL",
  "TEST_ADMIN_PASSWORD",
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing required integration-test environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const url = process.env.TEST_SUPABASE_URL;
if (!url.includes("localhost") && process.env.ALLOW_REMOTE_SUPABASE_TESTS !== "true") {
  console.error("Refusing to run against a remote Supabase project. Set ALLOW_REMOTE_SUPABASE_TESTS=true only for a dedicated test project.");
  process.exit(1);
}

function clientFor(email, password) {
  return { client: createClient(url, process.env.TEST_SUPABASE_ANON_KEY), email, password };
}

async function signIn(account) {
  const { data, error } = await account.client.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });
  if (error || !data.user) throw new Error(`Could not sign in test account ${account.email}: ${error?.message || "no user"}`);
  return data.user;
}

async function getProfile(account, expectedUserId) {
  const { data, error } = await account.client
    .from("profiles")
    .select("id, role")
    .eq("id", expectedUserId)
    .single();
  if (error || !data) throw new Error(`Could not read own profile for ${account.email}: ${error?.message || "no profile"}`);
  return data;
}

async function main() {
  const studentA = clientFor(process.env.TEST_STUDENT_A_EMAIL, process.env.TEST_STUDENT_A_PASSWORD);
  const studentB = clientFor(process.env.TEST_STUDENT_B_EMAIL, process.env.TEST_STUDENT_B_PASSWORD);
  const admin = clientFor(process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD);

  const [userA, userB, adminUser] = await Promise.all([signIn(studentA), signIn(studentB), signIn(admin)]);
  const [profileA, profileB, adminProfile] = await Promise.all([
    getProfile(studentA, userA.id),
    getProfile(studentB, userB.id),
    getProfile(admin, adminUser.id),
  ]);

  if (profileA.role !== "STUDENT" || profileB.role !== "STUDENT") {
    throw new Error("Student test accounts must have the STUDENT role.");
  }
  if (adminProfile.role !== "ADMIN") {
    throw new Error("Admin test account must have the ADMIN role.");
  }

  const { data: otherProfile, error: otherProfileError } = await studentA.client
    .from("profiles")
    .select("id")
    .eq("id", userB.id);
  if (otherProfileError) throw new Error(`Cross-user profile query failed unexpectedly: ${otherProfileError.message}`);
  if (otherProfile?.length) throw new Error("RLS failure: Student A can read Student B's profile.");

  const { data: otherConversations, error: conversationError } = await studentA.client
    .from("conversations")
    .select("id")
    .eq("user_id", userB.id);
  if (conversationError) throw new Error(`Cross-user conversation query failed unexpectedly: ${conversationError.message}`);
  if (otherConversations?.length) throw new Error("RLS failure: Student A can read Student B's conversations.");

  const { data: adminProfiles, error: adminProfilesError } = await admin.client
    .from("profiles")
    .select("id")
    .in("id", [userA.id, userB.id]);
  if (adminProfilesError) throw new Error(`Admin profile query failed: ${adminProfilesError.message}`);
  if (adminProfiles?.length !== 2) throw new Error("Authorization failure: Admin cannot read both student profiles.");

  await Promise.all([studentA.client.auth.signOut(), studentB.client.auth.signOut(), admin.client.auth.signOut()]);
  console.info("Supabase auth/RLS/admin verification passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
