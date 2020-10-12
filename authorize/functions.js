const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");

function authorizeUser(request, response, next) {
  if (request.body.token == null) {
    console.log("token is undefined");
    return response.status(401).send();
  }
  const jwk = {
    keys: [
      {
        alg: "RS256",
        e: "AQAB",
        kid: "S0zmSr8cUkYk7N/GiG47zN5+gk6uZcogl/ZpR9GNNJE=",
        kty: "RSA",
        n:
          "0HP0JBztQMlqxg2DOtlFlVpspMzaq6XocQltislMAFODFHZbvODT4GZh-XkAjES9cm4DTQGq9AQWTNUzYVwIJhQHy6c95k9KOnHCVeTrjjI5ArQouE1-Tk8qJRrOlJrftb2whqgdTtNJGMNyS2jUOAz35SXSHiKTEAe9hVBVQnpuGyQbFbOYFYZRZRF5Q70npqNC3SfNA6agL1peRqEZnJeb4paoeCCoeebAZ_6VnecZ2fOThfnRK2-wLAayzVYoWO6u0G2wk9xD5iRRJE0aiZnVMZjivCqhPCjIUPbPST5IzwRPb1j6OZn6dZ0qblsW1TlBTApalqOM3FKSZFreBw",
        use: "sig",
      },
      {
        alg: "RS256",
        e: "AQAB",
        kid: "yWed275ARP65zEoGyDbyIXjdlt7GD8uu52gTut+0ZpY=",
        kty: "RSA",
        n:
          "lvjyZ3DyOnBnoFHNF4rj6Yt-EjkSMwZl3_c9WEM88Umsgkjgbu4u1qRF2KPWAb8vzow8-S_TXS9jIf0ZM4pzc9Go1awoBTZQ2OIu19RIaWj2em-KmmSPmnE_d6o7Z5NrFAz--v87_U1izqqDi-M3BrVnUFtd2au7sXREsD914vhY3H2Lge7zHCW7oPbC_i0nYDnqYF38W19cWG3LRHH-VdblaL1cT62LMi3UpxBeyA58NTA2fEOep7-SJPFsRxDHFsicCufCUmVXEjk0txPx_Z7Zay1KJX08AQAE3uUTW7UF5Jtyie0-cAnF9AZCgvM-fQ5Kt2Mz_RnguEV4faIj9Q",
        use: "sig",
      },
    ],
  };
  const jwkForIdToken = jwk.keys[0];
  const pem = jwkToPem(jwkForIdToken);
  try {
    jwt.verify(request.body.token, pem, (error, decodedToken) => {
      if (error) {
        console.log(error);
        return response.status(403).send(error);
      }
      console.log("decoded token", decodedToken);
      request.decodedToken = decodedToken;
      next();
    });
  } catch (error) {
    return response.status(500).send(error);
  }
}

module.exports = authorizeUser;
