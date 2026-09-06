import { Issuer, generators } from "openid-client";

let client;

export const getNamoidClient = async () => {
  if (client) return client;

  const namoidIssuer = await Issuer.discover(process.env.NAMOID_ISSUER_URL);

  client = new namoidIssuer.Client({
    client_id: process.env.NAMOID_CLIENT_ID,
    client_secret: process.env.NAMOID_CLIENT_SECRET,
    redirect_uris: [process.env.NAMOID_CALLBACK_URL],
    response_types: ["code"],
  });

  return client;
};

export const generatePkce = () => {
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
};