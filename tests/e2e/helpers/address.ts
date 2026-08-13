function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — check your .env.test or .env.test.local`);
  return value;
}

export const TEST_ADDRESS = {
  name: requireEnv("TEST_ADDRESS_NAME"),
  phone: requireEnv("TEST_ADDRESS_PHONE"),
  email: requireEnv("TEST_ADDRESS_EMAIL"),
  address: requireEnv("TEST_ADDRESS_STREET"),
  city: requireEnv("TEST_ADDRESS_CITY"),
  state: requireEnv("TEST_ADDRESS_STATE"),
  pincode: requireEnv("TEST_ADDRESS_PINCODE"),
};
